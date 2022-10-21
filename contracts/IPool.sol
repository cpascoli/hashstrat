// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

interface IPool {
    function totalValue() external view returns(uint);
    function riskAssetValue() external view returns(uint);
    function stableAssetValue() external view returns(uint);
}