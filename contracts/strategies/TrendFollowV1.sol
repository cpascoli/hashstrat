// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./IStrategy.sol";
import "./../IPool.sol";
import "../IPriceFeed.sol";

/**
 * This strategy aims to follow the trend buying the risk asset when the price is above a predefined moving average
 * and selling into the stable asset when the price is below such moving average.
 * 
 * The strategy is configured with the following parameters:
 * - movingAveragePeriod: the period used to determine the average of the price.
 * - tokensToSwapPerc: the percentage of the risk/stable assets to BUY/SELL when the trade logic is triggered.
 * - minAllocationPerc: the minium percentage of the porfolio that should be allocated to both the stable and risk assets at all times.
 */

contract TrendFollowV1 is IStrategy, Ownable {

    uint public maxPriceAge = 6 * 60 * 60; // use prices old 6h max (in Kovan prices are updated every few hours)

    IPool public pool;
    IPriceFeed public feed;
    IERC20Metadata public depositToken;
    IERC20Metadata public investToken;

    uint public immutable minEvalInterval;    // the min time that should pass to update the moving average and eval iterations (in seconds)
    uint public immutable movingAveragePeriod; // The period of the moving average, for example 50 period
    uint public movingAverage;      // The current value of the Moving Average. Needs to be initialized at deployment (uses pricefeed.decimals)
    uint public lastEvalTime;       // the last time that the strategy was evaluated


    // [0-100] intervals
    uint public immutable minAllocationPerc;   // the min percentage of pool value to hold in deposit and invest tokens (e.g 20%)
    uint public immutable targetPricePercUp;   // the percentage the price should move above the moving average to trigger a SELL of invest tokens (e.g 66%)
    uint public immutable targetPricePercDown; // the percentage the price shold move below the moving average to trigger a BUY of invest tokens (e.g 33%)
    uint public immutable tokensToSwapPerc;     // the percentage of deposit/invest tokens to BUY/SELL when the stategy trigger a BUY/SELL (e.g 5%)

    uint percentPrecision = 100 * 100;


    constructor(
        address _poolAddress,
        address _feedAddress,
        address _depositTokenAddress,
        address _investTokenAddress,

        uint _movingAveragePeriod,
        uint _initialMeanValue,
        uint _minEvalInterval,

        uint _minAllocationPerc,
        uint _targetPricePercUp,
        uint _targetPricePercDown,
        uint _tokensToSwapPerc

    ) {
        pool = IPool(_poolAddress);
        feed = IPriceFeed(_feedAddress);
        depositToken = IERC20Metadata(_depositTokenAddress);
        investToken = IERC20Metadata(_investTokenAddress);

        movingAveragePeriod = _movingAveragePeriod;
        movingAverage = _initialMeanValue;
        minEvalInterval = _minEvalInterval;

        minAllocationPerc = _minAllocationPerc;
        targetPricePercUp = _targetPricePercUp;
        targetPricePercDown = _targetPricePercDown;
        tokensToSwapPerc = _tokensToSwapPerc;

        lastEvalTime = block.timestamp;
    }

    function name() public override pure returns(string memory) {
        return "MeanReversionV1";
    }

    function description() public override pure returns(string memory) {
        return "A mean reversion strategy for a 2 token portfolio";
    }


    function evaluate() public override returns(StrategyAction action, uint amountIn) {

        require(address(pool) != address(0), "poolAddress is 0");
        require(feed.getLatestPrice() >= 0, "Price is negative");
        
        // don't use old prices
        if ((block.timestamp - feed.getLatestTimestamp()) > maxPriceAge) return (StrategyAction.NONE, 0);

        // 1. first update the moving average
        updateMovingAverage(feed.getLatestPrice());


        // do nothing if the pool is empty
        uint poolValue = pool.totalPortfolioValue();
        if (poolValue == 0) {
            return (StrategyAction.NONE, 0);
        }

        // 2. handle rebalancing situations when eaither token balance is too low
        uint depositTokensToSell = rebalanceDepositTokensAmount();
        if (depositTokensToSell > 0) {
            return (StrategyAction.BUY, depositTokensToSell);
        }

        uint investTokensToSell = rebalanceInvestTokensAmount();
        if (investTokensToSell > 0) {
            return (StrategyAction.SELL, investTokensToSell);
        }
        
        // 3. determine if should make a trade
        (action, amountIn) = evaluateTrade();
    }


    function evaluateTrade() public view returns (StrategyAction action, uint amountIn) {

        action = StrategyAction.NONE;
        uint poolValue = pool.totalPortfolioValue();

        int deltaPrice = feed.getLatestPrice() - int(movingAverage);  // can be negative
        int deltaPricePerc = int(percentPrecision) * deltaPrice / int(movingAverage);

        uint investPerc = investPercent(); // the % of invest tokens in the pool with percentPrecision
        uint depositPerc = poolValue > 0 ? percentPrecision - investPerc : 0;    // with percentPrecision
        uint minAllocationPercent = minAllocationPerc * percentPrecision / 100;
        uint targetPricePercUpPercent = targetPricePercUp * percentPrecision / 100;
        uint targetPricePercDownPercent = targetPricePercDown * percentPrecision / 100;

        bool shouldSell = deltaPricePerc < 0 &&
                          deltaPricePerc <= -1 * int(targetPricePercDownPercent) && 
                          investPerc > minAllocationPercent;

        if (shouldSell) {
            // need to SELL invest tokens buying deposit tokens
            action = StrategyAction.SELL;
            amountIn = investToken.balanceOf(address(pool)) * tokensToSwapPerc / 100;
        }

        bool shouldBuy = deltaPricePerc > 0 &&
                        uint(deltaPricePerc) >= targetPricePercUpPercent && 
                        depositPerc > minAllocationPercent;

        if (shouldBuy) {
            // need to BUY invest tokens spending depositTokens
            action = StrategyAction.BUY;
            amountIn = depositToken.balanceOf(address(pool)) * tokensToSwapPerc / 100;
        }

        return (action, amountIn);
    }


    // Returns the % of invest tokens with percentPrecision precision
    function investPercent() public view returns (uint investPerc) {

        uint investTokenValue = pool.investedTokenValue();
        uint poolValue = pool.totalPortfolioValue();
        if (poolValue == 0) return 0;

        investPerc = (percentPrecision * investTokenValue / poolValue); // the % of invest tokens in the pool
    }


    // determine the amount of deposit tokens to SELL to have minAllocationPerc % invest tokens
    function rebalanceDepositTokensAmount() public view returns (uint) {

            uint investPerc = investPercent(); // with percentPrecision digits
            uint targetInvestPerc = minAllocationPerc * percentPrecision / 100;
            uint amountIn = 0;

            if (investPerc < targetInvestPerc) {

                require(percentPrecision >= targetInvestPerc, "percentPrecision < targetInvestPerc");

                // calculate amount of deposit tokens to sell (to BUY invest tokens)
                uint targetDepositPerc = percentPrecision - targetInvestPerc;  //  1 - invest_token %
                uint poolValue = pool.totalPortfolioValue();
                uint targetDepositValue = poolValue * targetDepositPerc / percentPrecision;

                uint depositTokenValue = pool.depositTokenValue();
                amountIn = (depositTokenValue > targetDepositValue) ? depositTokenValue - targetDepositValue : 0;
            }

        return amountIn;
    }

    // determine the amount of invest tokens to SELL to have minAllocationPerc % deposit tokens
    function rebalanceInvestTokensAmount() public view returns (uint) {

        uint investPerc = investPercent(); // with percentPrecision digits
        uint depositPerc = percentPrecision - investPerc; //  1 - invest_token %

        uint targetDepositPerc = minAllocationPerc * percentPrecision / 100;
        uint amountIn = 0;

     
        if (depositPerc < targetDepositPerc) {
            // calculate amount of invest tokens to sell (to BUY deposit tokens)
            uint price = uint(feed.getLatestPrice());

            // need to SELL some investment tokens
            uint poolValue = pool.totalPortfolioValue();
            uint investTokenValue = pool.investedTokenValue();

            uint targetInvestPerc = percentPrecision - targetDepositPerc;  //  1 - deposit_token % (e.g. 80%)
            uint targetInvestTokenValue = poolValue * targetInvestPerc / percentPrecision;

            // ensure we have invest tokens to sell
            require(investTokenValue >= targetInvestTokenValue, "investTokenValue < targetInvestTokenValue");


            uint deltaTokenPrecision = decimalDiffFactor();  // this factor accounts for difference in decimals between the 2 tokens
            uint pricePrecision = 10 ** uint(feed.decimals());
            
            // calcualte amount of investment tokens to SELL
            if (investToken.decimals() >= depositToken.decimals()) {
                amountIn = pricePrecision * deltaTokenPrecision * (investTokenValue - targetInvestTokenValue) / price;
            } else {
                amountIn = pricePrecision * (investTokenValue - targetInvestTokenValue) / price / deltaTokenPrecision;
            }
        }

        return amountIn;
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


    function updateMovingAverage(int price) internal {

        uint daysSinceLasUpdate =  (block.timestamp - lastEvalTime) / 86400; // days elapsed since the moving average was updated
        if (daysSinceLasUpdate == 0) return;

        if (daysSinceLasUpdate >= movingAveragePeriod) {
            movingAverage = uint(price);
            lastEvalTime = block.timestamp;
        } else  {
            // update the moving average, using the average price for 'movingAveragePeriod' - 'daysSinceLasUpdate' days 
            // and the current price for the last 'daysSinceLasUpdate' days
            uint oldPricesWeight =  movingAverage * ( movingAveragePeriod - daysSinceLasUpdate);
            uint newPriceWeight = daysSinceLasUpdate * uint(price);
            movingAverage = (oldPricesWeight + newPriceWeight ) / movingAveragePeriod;
            
            // remember when the moving average was updated
            lastEvalTime = block.timestamp;
        }
    }


    // Only Owner setters
    function setMaxPriceAge(uint _maxPriceAge) public onlyOwner {
        maxPriceAge = _maxPriceAge;
    }

    function setPool(address _poolAddress) public onlyOwner {
        pool = IPool(_poolAddress);
    }

    function setmMovingAverage(uint _movingAverage) public onlyOwner {
        movingAverage = _movingAverage;
    }

}