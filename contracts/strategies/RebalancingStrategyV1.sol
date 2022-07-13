// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./IStrategy.sol";
import "./../IPool.sol";
import "../IPriceFeed.sol";

/**
  A simple rebalancing strategy for a portfolio of 2 tokens.
  When the value of one of the tokens grows above (targetInvestPerc + rebalancingThreshold)
  or drops below (targetInvestPerc - rebalancingThreshold) then the strategy returns the amount
  of tokens to BUY or SELL in order to rebalance the portfolio.
  This strategy can be used, for example, to maintain an ETH/USD portfolio at 60%/40%.
  If 'rebalancingThreshold' is set at 10%, wHen the vaue of ETH (measured in USD) grows above 70%,
  or drops below 50%, the portfoio is rebalanced to the original 60%/40% allocation.
 */
contract RebalancingStrategyV1 is IStrategy, Ownable {

    event StrategyInfo( uint investPerc, uint investTokenValue, uint lowerBound, uint upperBound);

    uint public maxPriceAge = 6 * 60 * 60; // use prices old 6h max (in Kovan prices are updated every few hours)
    uint public targetInvestPerc;  // [0-100] interval
    uint public rebalancingThreshold; // [0-100] interval

    IPool public pool;
    IPriceFeed public feed;
    IERC20Metadata public depositToken;
    IERC20Metadata public investToken;

   
    constructor(
        address _poolAddress,
        address _feedAddress,
        address _depositTokenAddress,
        address _investTokenAddress,
        uint _targetInvestPerc,
        uint _rebalancingThreshold
    ) {
        pool = IPool(_poolAddress);
        feed = IPriceFeed(_feedAddress);
        depositToken = IERC20Metadata(_depositTokenAddress);
        investToken = IERC20Metadata(_investTokenAddress);
        targetInvestPerc = _targetInvestPerc;
        rebalancingThreshold = _rebalancingThreshold;
    }

    function name() public override pure returns(string memory) {
        return "RebalancingStrategyV1";
    }

    function description() public override pure returns(string memory) {
        return "A simple rebalancing strategy for a 2 token portfolio";
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

    function setPool(address _poolAddress) public onlyOwner {
        pool = IPool(_poolAddress);
    }


    function evaluate() public override returns(StrategyAction, uint) {

        require(address(pool) != address(0), "poolAddress is 0");
        require(feed.getLatestPrice() >= 0, "Price is negative");
        
        uint time = feed.getLatestTimestamp();
        // don't use old prices
        if (block.timestamp > time && (block.timestamp - time) > maxPriceAge) return (StrategyAction.NONE, 0);

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