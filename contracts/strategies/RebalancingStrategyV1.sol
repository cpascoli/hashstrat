// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IStrategy.sol";

contract RebalancingStrategyV1 is IStrategy, Ownable {

    IERC20 internal depositToken;
    IERC20 internal investToken;

    uint public maxPriceAge = 6 * 60 * 60; // use prices old 6h max (in Kovan prices are updated every few hours)
    uint public targetInvestPerc;
    uint public rebalancingThreshold;
    address poolAddress;

    constructor(address _depositTokenAddress, address _investTokenAddress, uint _targetInvestPerc, uint _rebalancingThreshold) public {
        depositToken = IERC20(_depositTokenAddress);
        investToken = IERC20(_investTokenAddress);
        targetInvestPerc = _targetInvestPerc;
        rebalancingThreshold = _rebalancingThreshold;
    }

    function setPoolAddress(address _poolAddress) public onlyOwner {
        require(poolAddress == address(0), "Pool address alreadt set");
        poolAddress = _poolAddress;
    }

    function setMaxPriceAge(uint secs) public onlyOwner {
        maxPriceAge = secs;
    }

    function name() public override view returns(string memory _) {
        return "RebalancingStrategyV1";
    }

    function description() public override view returns(string memory _) {
        return "A simple rebalancing strategy";
    }

    function evaluate(int investTokenPrice, uint time) public override view returns(StrategyAction action, uint amountIn) {

        require(investTokenPrice >= 0, "Price is negative");
        require(poolAddress != address(0), "poolAddress is 0");

        // don't use old prices
        if (block.timestamp > time && (block.timestamp - time) > maxPriceAge) return (StrategyAction.NONE, 0);

        uint price = uint(investTokenPrice);

        uint256 depositTokenBalance = depositToken.balanceOf(poolAddress);
        uint256 investTokenBalance = investToken.balanceOf(poolAddress);

        uint depositTokenValue = depositTokenBalance;
        uint investTokenValue = investTokenBalance * price;
        uint poolValue = investTokenValue + depositTokenValue;

        action = StrategyAction.NONE;
        uint investPerc = (100 * investTokenValue / poolValue);

        if (investPerc > targetInvestPerc) {
            // delta := 85 - 60
            uint deltaPerc = investPerc - targetInvestPerc;
            if (deltaPerc >= rebalancingThreshold) {   // 25%
                // need to sell some investment tokens for deposit tokens
                // calcualte amount of investment tokens to SWAP
                action = StrategyAction.SELL;
                uint targetInvestTokenValue = poolValue * targetInvestPerc / 100;
                amountIn = (investTokenValue - targetInvestTokenValue) / price;
            }
        } else {
            uint targetDepositPerc = 100 - targetInvestPerc;
            uint depositPerc = (100 * depositTokenValue / poolValue);
            uint deltaPerc = depositPerc - targetDepositPerc;
            if (deltaPerc >= rebalancingThreshold) {    // 25%
                // need to sell some deposit tokens for invest tokens
                // calculate amount of deposit tokens to SWAP
                action = StrategyAction.BUY;
                uint targetDepositValue = poolValue * targetDepositPerc / 100;
                amountIn = depositTokenValue - targetDepositValue;
            }
        }

        return (action, amountIn);
    }

}