// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../IPriceFeed.sol";

enum StrategyAction { BUY, SELL, NONE }

interface IStrategy {
    function description() external view returns(string memory _);
    function name() external view returns(string memory _);
    function evaluate(address poolAddress, address feedAddress) external returns(StrategyAction action, uint amount);
}