// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IUniswapV2Router.sol";

contract UniswapV2Router is IUniswapV2Router {

    address public poolAddress;

    IERC20 internal depositTokenAddress;
    IERC20 internal investToken;

    uint256 public price = 2;

    event Swapped(uint256 amountIn, uint256 amountOut, uint256 price);

    constructor(address _depositTokenAddress, address _investTokenAddress) public  {
         depositTokenAddress = IERC20(_depositTokenAddress);
         investToken = IERC20(_investTokenAddress);
    }


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


        uint amount = amountIn / price;

        depositTokenAddress.transferFrom(poolAddress, address(this), amountIn);
        investToken.transfer(to, amount);

        emit Swapped(amountIn, amount, price);

        return new uint[](0);
    }

    function setPrice(uint _price) external {
        price = _price;
    }

    function setPoolAddress(address _poolAddress) external {
        poolAddress = _poolAddress;
    }

}