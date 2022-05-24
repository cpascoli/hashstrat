// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./IUniswapV2Router.sol";

/**
    Mock implementation of swap functionality and price feed via the interfaces:
    - UniswapV2Router to swap depositTokens into investTokens
    - AggregatorV3Interface to provide price for the  investTokens/depositTokens pair
 */
contract UniswapV2Router is IUniswapV2Router, AggregatorV3Interface {

    address public poolAddress;

    IERC20 internal depositToken;
    IERC20 internal investToken;

    uint256 public price = 2;

    event Swapped(string direction, uint256 amountIn, uint256 amountOut, uint256 price);

    constructor(address _depositTokenAddress, address _investTokenAddress) public  {
         depositToken = IERC20(_depositTokenAddress);
         investToken = IERC20(_investTokenAddress);
    }


    // Set the price used for the investTokens/depositTokens swap
    function setPrice(uint _price) external {
        price = _price;
    }

    // Set the poolAddress (probably reduntant)
    function setPoolAddress(address _poolAddress) external {
        poolAddress = _poolAddress;
    }


    //// UniswapV2Router interface implementation
     
    function getAmountsOut(uint amountIn, address[] calldata /* path */) external override view returns (uint[] memory amounts) {
        uint[] memory amountOutMins = new uint[](3);
        // amountOutMins[2] = 1;
        amountOutMins[2] = amountIn / price;

        return amountOutMins;
    }

    function swapExactTokensForTokens(
        uint amountIn, //amount of tokens we are sending in
        uint amountOutMin, //the minimum amount of tokens we want out of the trade
        address[] calldata path,  //list of token addresses we are going to trade in.  this is necessary to calculate amounts
        address to,  //this is the address we are going to send the output tokens to
        uint deadline //the last time that the trade is valid for
    )  external override returns (uint[] memory amounts) {

        require(poolAddress != address(0), "poolAddress not set");

        if (path[0] == address(depositToken)) {

            // swap USD => ETH
            uint amount = amountIn / price;
            depositToken.transferFrom(poolAddress, address(this), amountIn);

            require(investToken.balanceOf(address(this)) >= amount, "Not enough ETH in the pool");
            investToken.transfer(to, amount);

            emit Swapped("USD -> ETH", amountIn, amount, price);

        } else if (path[0] == address(investToken)) {

            // swap ETH => USD
            investToken.transferFrom(poolAddress, address(this), amountIn);

            uint amount = amountIn * price;
            require(depositToken.balanceOf(address(this)) >= amount, "Not enough USD in the pool");
            depositToken.transfer(to, amount);

            emit Swapped("ETH -> USD", amountIn, amount, price);
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


    function decimals() external override view  returns (uint8) {
        return 18;
    }

    function description() external override view returns (string memory) {
        return "Mock price feed";
    }

    function version() external override view  returns (uint256) {
        return 1;
    }


    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId) override external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (0, int256(price), 0, 0, 0);
    }


    function concat(string memory _x, string memory _y) pure internal returns (string memory) {
        bytes memory _xBytes = bytes(_x);
        bytes memory _yBytes = bytes(_y);

        string memory _tmpValue = new string(_xBytes.length + _yBytes.length);
        bytes memory _newValue = bytes(_tmpValue);

        uint i;
        uint j;

        for(i=0;i<_xBytes.length;i++) {
            _newValue[j++] = _xBytes[i];
        }

        for(i=0;i<_yBytes.length;i++) {
            _newValue[j++] = _yBytes[i];
        }

        return string(_newValue);
    }

}