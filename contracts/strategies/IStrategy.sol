// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;


enum StrategyAction { NONE, BUY, SELL }

interface IStrategy {
    function name() external view returns(string memory);
    function description() external view returns(string memory);
    function evaluate() external returns(StrategyAction action, uint amount);
}