// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IUniswapV2Router {

    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);

    function swapExactTokensForTokens(
        uint amountIn, //amount of tokens we are sending in
        uint amountOutMin, //the minimum amount of tokens we want out of the trade
        address[] calldata path,  //list of token addresses we are going to trade in.  this is necessary to calculate amounts
        address to,  //this is the address we are going to send the output tokens to
        uint deadline //the last time that the trade is valid for
    ) external returns (uint[] memory amounts);

    function WETH() external returns (address addr);
}