// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../IPriceFeed.sol";

enum StrategyAction { BUY, SELL, NONE }

interface IStrategy {
    function name() external view returns(string memory);
    function description() external view returns(string memory);
    function evaluate() external returns(StrategyAction action, uint amount);
}