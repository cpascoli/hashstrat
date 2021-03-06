// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "../IUniswapV2Router.sol";


/**
    Mock implementation of swap functionality and price feed via the interfaces:
    - UniswapV2Router to swap depositTokens into investTokens
    - AggregatorV3Interface to provide price for the  investTokens/depositTokens pair
 */
contract UniswapV2Router is IUniswapV2Router, AggregatorV3Interface {

    address public poolAddress;

    IERC20Metadata internal depositToken;
    IERC20Metadata internal investToken;

    uint public price;
    uint public pricePrecision = 10**8;
    uint public slippage = 0; // slippage percent using 4 decimals (e.g 2% slippage is 200)

    event Swapped(string direction, uint256 amountIn, uint256 amountOut, uint256 price, uint slippage);

    constructor(address _depositTokenAddress, address _investTokenAddress) {
         depositToken = IERC20Metadata(_depositTokenAddress);
         investToken = IERC20Metadata(_investTokenAddress);
         price = 2 * pricePrecision;
    }


    // Set the price used for the investTokens/depositTokens swap
    function setPrice(uint _price) external {
        price = _price * pricePrecision;
    }

    function setSlippage(uint _slippage) external {
        slippage = _slippage;
    }

    // Set the poolAddress (probably reduntant)
    function setPool(address _poolAddress) external {
        poolAddress = _poolAddress;
    }


    //// UniswapV2Router interface implementation

    function WETH() external override view returns (address addr) {
        // assume the WETH intermediary token for token-to-token swaps is the investToken address
        return address(investToken);
    }

    function getAmountsOut(uint amountIn, address[] calldata path) external override view returns (uint[] memory amounts) {
        uint[] memory amountOutMins = new uint[](path.length);
        uint amountOut;

        if (path[0] == address(depositToken)) {

            uint tokenInDecimals = uint(depositToken.decimals());
            uint tokenOutDecimals = uint(investToken.decimals());

            // swap USD => ETH
              uint amountInAdjusted = (tokenOutDecimals >= tokenInDecimals) ?
                 amountIn * (10 ** (tokenOutDecimals - tokenInDecimals)) :
                 amountIn / (10 ** (tokenInDecimals - tokenOutDecimals));

            amountOut = amountInAdjusted * pricePrecision / price * (10000 - slippage) / 10000;

        } else if (path[0] == address(investToken)) {
            // swap ETH => USD

            uint tokenInDecimals = uint(investToken.decimals());
            uint tokenOutDecimals = uint(depositToken.decimals());

            uint amountInAdjusted = (tokenOutDecimals >= tokenInDecimals) ?
               amountIn * (10 ** (tokenOutDecimals - tokenInDecimals)) :
               amountIn / (10 ** (tokenInDecimals - tokenOutDecimals));

            amountOut = amountInAdjusted * price / pricePrecision * (10000 - slippage) / 10000;
        }

        amountOutMins[path.length-1] = amountOut;
        return amountOutMins;
    }

    function swapExactTokensForTokens(
        uint amountIn, //amount of tokens we are sending in
        uint /*amountOutMin*/, //the minimum amount of tokens we want out of the trade
        address[] calldata path,  //list of token addresses we are going to trade in.  this is necessary to calculate amounts
        address to,  //this is the address we are going to send the output tokens to
        uint /*deadline*/ //the last time that the trade is valid for
    )  external override returns (uint[] memory amounts) {

        require(poolAddress != address(0), "poolAddress not set");

        uint depositTokenDecimals = uint(depositToken.decimals());
        uint investTokensDecimals = uint(investToken.decimals());
        
        if (path[0] == address(depositToken)) {
            // swap USD => ETH
            depositToken.transferFrom(poolAddress, address(this), amountIn);
            // account for difference in decimal places
            uint amountInAdjusted = (investTokensDecimals >= depositTokenDecimals) ?
                    amountIn * (10 ** (investTokensDecimals - depositTokenDecimals)) :
                    amountIn / (10 ** (depositTokenDecimals - investTokensDecimals));
    
            uint amount = amountInAdjusted * pricePrecision / price * (10000 - uint(slippage)) / 10000;
            require(investToken.balanceOf(address(this)) >= amount, "Not enough ETH in the pool");
            investToken.transfer(to, amount);

            emit Swapped("USD -> ETH", amountIn, amount, price, slippage);

        } else if (path[0] == address(investToken)) {
            // swap ETH => USD
            investToken.transferFrom(poolAddress, address(this), amountIn);
            // account for difference in decimal places
            uint amountInAdjusted = (investTokensDecimals >= depositTokenDecimals) ?
                    amountIn / (10 ** (investTokensDecimals - depositTokenDecimals)) :
                    amountIn * (10 ** (depositTokenDecimals - investTokensDecimals));

            uint amount = amountInAdjusted * price / pricePrecision * (10000 - uint(slippage)) / 10000;
            
            require(depositToken.balanceOf(address(this)) >= amount, "Not enough USD in the pool");
            depositToken.transfer(to, amount);

            emit Swapped("ETH -> USD", amountIn, amount, price, slippage);
        }

        return new uint[](0);
    }



    //// AggregatorV3Interface interface implementation

    function latestRoundData() external override view  returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (0, int256(price), block.timestamp, block.timestamp, 0);
    }


    function decimals() external override pure  returns (uint8) {
        return 8;
    }

    function description() external override pure returns (string memory) {
        return "Mock price feed";
    }

    function version() external override pure  returns (uint256) {
        return 1;
    }


    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 /*_roundId */) external override view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (0, int256(price), 0, 0, 0);
    }

    function getLatestPrice() external view returns (int256) {
        return int256(price);
    }

    function concat(string memory _x, string memory _y) internal pure returns (string memory) {
        bytes memory _xBytes = bytes(_x);
        bytes memory _yBytes = bytes(_y);

        string memory _tmpValue = new string(_xBytes.length + _yBytes.length);
        bytes memory _newValue = bytes(_tmpValue);

        uint i;
        uint j;

        for(i = 0; i<_xBytes.length; i++) {
            _newValue[j++] = _xBytes[i];
        }

        for(i = 0; i<_yBytes.length; i++) {
            _newValue[j++] = _yBytes[i];
        }

        return string(_newValue);
    }

}