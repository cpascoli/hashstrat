// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

interface IPool {
    function totalPortfolioValue() external view returns(uint);
    function investedTokenValue() external view returns(uint);
    function depositTokenValue() external view returns(uint);
}