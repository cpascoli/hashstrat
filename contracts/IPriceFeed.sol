// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

interface IPriceFeed {
    function getLatestPrice() external view returns (int);
    function getLatestTimestamp() external view returns (uint);
    function decimals() external view returns (uint8);
}