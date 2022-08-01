// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IPriceFeed {
    function getLatestPrice() external view returns (int);
    function getLatestTimestamp() external view returns (uint);
    function decimals() external view returns (uint8);
}