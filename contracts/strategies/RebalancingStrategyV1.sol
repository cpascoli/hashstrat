// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../IERC20Metadata.sol";
import "./IStrategy.sol";
import "./../IPool.sol";
import "../IPriceFeed.sol";


contract RebalancingStrategyV1 is IStrategy, Ownable {

    IERC20Metadata internal depositToken;
    IERC20Metadata internal investToken;

    uint public maxPriceAge = 6 * 60 * 60; // use prices old 6h max (in Kovan prices are updated every few hours)
    uint public targetInvestPerc;  // [0-100] interval
    uint public rebalancingThreshold; // [0-100] interval

    event StrategyInfo( uint investPerc, uint investTokenValue, uint upperBound, uint lowerBound);

    constructor(address _depositTokenAddress, address _investTokenAddress, uint _targetInvestPerc, uint _rebalancingThreshold) public {
        depositToken = IERC20Metadata(_depositTokenAddress);
        investToken = IERC20Metadata(_investTokenAddress);
        targetInvestPerc = _targetInvestPerc;
        rebalancingThreshold = _rebalancingThreshold;
    }

    function setTargetInvestPerc(uint _targetInvestPerc) public onlyOwner {
        targetInvestPerc = _targetInvestPerc;
    }

    function setRebalancingThreshold(uint _rebalancingThreshold) public onlyOwner {
        rebalancingThreshold = _rebalancingThreshold;
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


    function evaluate(address poolAddress, address feedAddress) public override returns(StrategyAction, uint) {

        IPriceFeed feed = IPriceFeed(feedAddress);
        require(poolAddress != address(0), "poolAddress is 0");
        require(feed.getLatestPrice() >= 0, "Price is negative");
        
        uint time = feed.getLatestTimestamp();
        // don't use old prices
        if (block.timestamp > time && (block.timestamp - time) > maxPriceAge) return (StrategyAction.NONE, 0);

        IPool pool = IPool(poolAddress);
        uint poolValue = pool.totalPortfolioValue();
        if (poolValue == 0) return (StrategyAction.NONE, 0);

        StrategyAction action = StrategyAction.NONE;
        uint amountIn;
        
        uint investTokenValue = pool.investedTokenValue();
        uint investPerc = (100 * investTokenValue / poolValue); // the % of invest tokens in the pool


        if (investPerc >= targetInvestPerc + rebalancingThreshold) {
            uint price = uint(feed.getLatestPrice());
            uint deltaPerc = investPerc - targetInvestPerc;
           
            require(deltaPerc >= 0 && deltaPerc <= 100, "Invalid deltaPerc SELL side");

            // need to SELL some investment tokens
            action = StrategyAction.SELL;
            uint targetInvestTokenValue = poolValue * targetInvestPerc / 100;
            uint deltaTokenPrecision = decimalDiffFactor();  // this factor accounts for difference in decimals between the 2 tokens
            uint pricePrecision = 10 ** uint(feed.decimals());
            
            // calcualte amount of investment tokens to sell
            if (investToken.decimals() >= depositToken.decimals()) {
                amountIn = pricePrecision * deltaTokenPrecision * (investTokenValue - targetInvestTokenValue) / price;
            } else {
                amountIn = pricePrecision * (investTokenValue - targetInvestTokenValue) / price / deltaTokenPrecision;
            }
        }
        
        // uint depositPerc = 100 - investPerc;   // 100 * depositTokenValue / poolValue; |||  100 - investPerc;
        // uint targetDepositPerc = 100 - targetInvestPerc;


        if (investPerc <= (targetInvestPerc - rebalancingThreshold)) {
            
            uint deltaPerc = targetInvestPerc - investPerc;
            require(deltaPerc >= 0 && deltaPerc <= 100, "Invalid deltaPerc BUY side");
            
            // need to BUY some invest tokens
            // calculate amount of deposit tokens to sell
            action = StrategyAction.BUY;
            //uint depositPerc = 100 - investPerc;
            uint targetDepositPerc = 100 - targetInvestPerc;
            uint targetDepositValue = poolValue * targetDepositPerc / 100;

            uint depositTokenValue = pool.depositTokenValue();
            require(depositTokenValue >= targetDepositValue, "Invalid amount of deposit tokens to sell");

            amountIn = depositTokenValue - targetDepositValue;
        }

        emit StrategyInfo(investPerc, investTokenValue, (targetInvestPerc - rebalancingThreshold), (targetInvestPerc + rebalancingThreshold));

        return (action, amountIn);
    }

    function decimalDiffFactor() internal view returns (uint) {

        uint depositTokenDecimals = uint(depositToken.decimals());
        uint investTokensDecimals = uint(investToken.decimals());
   
        //portoflio value is the sum of deposit token value and invest token value in the unit of the deposit token
        uint diff = (investTokensDecimals >= depositTokenDecimals) ?
             10 ** (investTokensDecimals - depositTokenDecimals):
             10 ** (depositTokenDecimals - investTokensDecimals);

        return diff;
    }

}