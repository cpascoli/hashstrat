// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./Wallet.sol";
import "./IUniswapV2Router.sol";
import "./PriceConsumerV3.sol";
import "./PoolLPToken.sol";
import "./strategies/IStrategy.sol";
import "./IPool.sol";
import "./IPriceFeed.sol";

import { PoolLib } from  "./PoolLib.sol";


contract Pool is IPool, Wallet, KeeperCompatibleInterface  {

    event Swapped(string swapType, uint spent, uint bought, uint slippage);
    event Deposited(uint amount, uint depositLP, uint totalPortfolioLP);
    event Withdrawn(uint amountWithdrawn, uint lpWithdrawn);
    event SlippageInfo(uint slippage, uint thereshold, uint amountIn, uint amountMin);


    IERC20Metadata internal investToken;

    /**
    * Use an interval in seconds and a timestamp to slow execution of Upkeep
    */
    uint public slippageThereshold = 500; // allow for 5% slippage on swaps (aka should receive at least 95% of the expected token amount)
    uint public immutable interval; // Upkeep interval
    uint public lastTimeStamp;      // last Upkeep timestamp
    uint public performUpkeepCounter;

    IUniswapV2Router uniswapV2Router;
    IPriceFeed priceFeed;
    PoolLPToken lpToken;
    IStrategy strategy;

    address immutable UNISWAPV2_WETH;
 

    PoolLib.SwapInfo[] public swaps;
    uint public swapCount;


    constructor(
        address _uniswapV2RouterAddress, 
        address _priceFeedAddress, 
        address _depositTokenAddress, 
        address _investTokenAddress, 
        address _lpTokenAddress,
        address _strategyAddress,
        uint _updateInterval) Wallet(_depositTokenAddress) {

        investToken = IERC20Metadata(_investTokenAddress);
        uniswapV2Router = IUniswapV2Router(_uniswapV2RouterAddress);
        lpToken = PoolLPToken(_lpTokenAddress);
        priceFeed = IPriceFeed(_priceFeedAddress);
        strategy = IStrategy(_strategyAddress);

        UNISWAPV2_WETH = uniswapV2Router.WETH();
        interval = _updateInterval;
        lastTimeStamp = block.timestamp;
    }


    //////  PORTFOLIO FUNCTIONS

    function depositTokenBalance() external view returns(uint256) {
        return depositToken.balanceOf(address(this));
    }


    function investTokenBalance() external view returns(uint256) {
        return investToken.balanceOf(address(this));
    }



    // returns the value of the deposit tokens in USD using the latest pricefeed price
    //TODO integrate depositToken/USD pricefeed
    function depositTokenValue() public override view returns(uint) {
        return depositToken.balanceOf(address(this));
    }


    // returns the value of the invest tokens in USD using the latest pricefeed price
    function investedTokenValue() public override view returns(uint) {

        uint investTokens = investToken.balanceOf(address(this));
        int investTokenPrice = priceFeed.getLatestPrice();
        require (investTokenPrice >= 0, "Invest token price can't be negative");

        uint depositTokenDecimals = uint(depositToken.decimals());
        uint investTokensDecimals = uint(investToken.decimals());
        uint priceFeedPrecision = 10 ** uint(priceFeed.decimals());
       
        uint value;        
         // portoflio value is the sum of deposit token value and invest token value in the unit of the deposit token
        if (investTokensDecimals >= depositTokenDecimals) {
            // invest token has more decimals than deposit token, have to divide the invest token value by the difference
            uint decimalsConversionFactor = 10 ** (investTokensDecimals - depositTokenDecimals);
            value = investTokens * uint(investTokenPrice) / decimalsConversionFactor / priceFeedPrecision;
        } else {
            // invest token has less decimals tham deposit token, have to multiply invest token value by the difference
            uint decimalsConversionFactor = 10 ** (depositTokenDecimals - investTokensDecimals);
            value = investTokens * uint(investTokenPrice) * decimalsConversionFactor / priceFeedPrecision;
        }

        return value;
    }


    // returns the portfolio value in depositTokens
    function totalPortfolioValue() public override view returns(uint) {
        uint depositTokens = depositToken.balanceOf(address(this));
        return depositTokens + investedTokenValue();
    }

    //////  PRICEFEED FUNCTIONS
    function latestFeedPrice() public view returns(int) {
        return priceFeed.getLatestPrice();
    }

    function latestFeedTimestamp() public view returns(uint) {
        return priceFeed.getLatestTimestamp();
    }


    //////  USER FUNCTIONS

    // Returns the % of the fund owned by the input _addr using 18 digits precision
    function portfolioPercentage(address _addr) public view returns (uint) {
        // the % of the portfolio of the user
        if (lpToken.totalSupply() == 0) return 0;

        uint precision = 10 ** uint(portfolioPercentageDecimals());
        return precision * lpToken.balanceOf(_addr) / lpToken.totalSupply();
    }


    function portfolioPercentageDecimals() public view returns (uint8) {
        return priceFeed.decimals();
    }


    function portfolioAllocartion() public view returns (uint)  {
        uint precision = 10 ** uint(portfolioPercentageDecimals());
        return (lpToken.totalSupply() == 0) ? 0 : precision * investedTokenValue() / totalPortfolioValue(); 
    }


    function portfolioValue(address _addr) public view returns (uint) {
        // the value of the portfolio allocated to the user, espressed in deposit tokens
        uint precision = 10 ** uint(portfolioPercentageDecimals());
        return totalPortfolioValue() * portfolioPercentage(_addr) / precision;
    }



    // User deposits 'amount' of depositTokens into the pool
    function deposit(uint amount) public override {


        // pool allocation before deposit
        uint investTokenPerc = portfolioAllocartion();

        // transfer deposit into the pool
        super.deposit(amount);

        uint depositLPTokens;

        if (lpToken.totalSupply() == 0) {
             ///// If first deposit => allocate the inital LP tokens amount to the user
            depositLPTokens = amount;
            invest(); // run the strategy after the first deposit
        } else {

            ///// if already have allocated LP tokens => calculate the additional LP tokens for this deposit

            // calculate portfolio % of the deposit (using lpPrecision digits precision)
            uint portFolioValue = totalPortfolioValue();
            require(portFolioValue > 0, "Portfolio value is 0");

            uint lpPrecision = 10 ** uint(lpToken.decimals());
            uint portFolioPercentage = lpPrecision * amount / portFolioValue;

            // calculate the amount of LP tokens for the deposit so that they represent 
            // a % of the existing LP tokens equivalent to the % value of this deposit to the whole portfolio value.
            // 
            // X := P * T / (1 - P)  
            //      X: additinal LP toleks to allocate to the user to account for this deposit
            //      P: Percentage of portfolio accounted by this deposit
            //      T: total LP tokens allocated before this deposit
    
            depositLPTokens = (portFolioPercentage * lpToken.totalSupply()) / ((1 * lpPrecision) - portFolioPercentage);
            uint precision = 10 ** uint(portfolioPercentageDecimals());
            uint rebalanceAmount = investTokenPerc * amount / precision;

            // swap some of the deposit amount into investTokens to keep the pool balanced at current levels
            swapIfNotExcessiveSlippage(StrategyAction.BUY, address(depositToken), address(investToken), rebalanceAmount, false);
        }


        lpToken.mint(msg.sender, depositLPTokens);
        emit Deposited(amount, depositLPTokens, lpToken.totalSupply());
    }


    // Withdraw an 'amount' of depositTokens from the pool
    function withdraw(uint amount) public override {
        uint value = totalPortfolioValue();
        require (value > 0, "Portfolio value is 0");

        // the % of the whole pool to be withdrawn
        uint precision = 10 ** uint(portfolioPercentageDecimals());
        uint withdrawPerc = precision * amount / value;

        // the LP amount to withdraw
        uint lpAmount = lpToken.totalSupply() * withdrawPerc / precision;

        withdrawLP(lpAmount);
    }


    // Withdraw all LP tokens
    function withdrawAll() public  {
        withdrawLP(lpToken.balanceOf(msg.sender));
    }

    // Withdraw the amount of lp tokens provided
    function withdrawLP(uint amount) public  {

        require(amount > 0, "Invalid LP amount");
        require(lpToken.totalSupply() > 0, "No LP tokens minted");
        require(amount <= lpToken.balanceOf(msg.sender), "LP balance exceeded");

        uint precision = 10 ** uint(portfolioPercentageDecimals());
        uint withdrawPerc = precision * amount / lpToken.totalSupply();

        // burn the user LP
        lpToken.burn(msg.sender, amount);

        // calculate amount of depositTokens & investTokens to withdraw
        uint depositTokensBeforeSwap = depositToken.balanceOf(address(this));
        uint investTokensBeforeSwap = investToken.balanceOf(address(this));

        // the amount of deposit and invest tokens to withdraw
        uint withdrawDepositTokensAmount = depositTokensBeforeSwap * withdrawPerc / precision;
        uint withdrawInvestTokensTokensAmount = investTokensBeforeSwap * withdrawPerc / precision;

        uint depositTokensSwapped = 0;
        // check if have to swap some invest tokens back into deposit tokens
        if (withdrawInvestTokensTokensAmount > 0) {
            // swap some investTokens into depositTokens to be withdrawn
            uint256 amountMin = getAmountOutMin(address(investToken), address(depositToken), withdrawInvestTokensTokensAmount);
            swap(address(investToken), address(depositToken), withdrawInvestTokensTokensAmount, amountMin, address(this));
        
            // determine how much depositTokens where swapped
            uint depositTokensAfterSwap = depositToken.balanceOf(address(this));
            require(depositTokensAfterSwap >= depositTokensBeforeSwap, "Deposit tokens after swap are less than amount before swap");
            depositTokensSwapped = depositTokensAfterSwap - depositTokensBeforeSwap;
        }


        // transfer depositTokens to the user
        uint amountToWithdraw = withdrawDepositTokensAmount + depositTokensSwapped;        
        super.withdraw(amountToWithdraw);

        emit Withdrawn(amountToWithdraw, amount);
    }



  
    //  Compute the slippage for a trade. The returned percentage is returned with 4 digits decimals
    //  E.g: For a 5% slippage below the expected amount 500 is returned
    function slippagePercentage(address tokenIn, address tokenOut, uint amountIn, uint amountMin) public view returns (uint) {
        
        require(priceFeed.getLatestPrice() > 0, "Invalid price");

        uint price = uint(priceFeed.getLatestPrice());
        uint pricePrecision = 10 ** uint(priceFeed.decimals());

        uint amountExpected;

        // swap USD => ETH
        if (tokenIn == address(depositToken) && tokenOut == address(investToken)) {
            uint tokenInDecimals = uint(depositToken.decimals());
            uint tokenOutDecimals = uint(investToken.decimals());
            uint amountInAdjusted = PoolLib.adjustAmountDecimals (tokenInDecimals, tokenOutDecimals, amountIn);
            amountExpected = amountInAdjusted * pricePrecision / price;
        } 

        // swap ETH => USD
        if (tokenIn == address(investToken) && tokenOut == address(depositToken)) {
            uint tokenInDecimals = uint(investToken.decimals());
            uint tokenOutDecimals = uint(depositToken.decimals());
            uint amountInAdjusted = PoolLib.adjustAmountDecimals (tokenInDecimals, tokenOutDecimals, amountIn);
            amountExpected = amountInAdjusted * price / pricePrecision;
        }

        require(amountExpected > 0, "Invalid amount expected");
        if (amountMin >= amountExpected) return 0;

        return 10000 - (10000 * amountMin / amountExpected); // e.g 10000 - 9500 = 500  (5% slippage)
    }



    function invest() public {

        // evaluate strategy to see if we should BUY or SELL
        (StrategyAction action, uint amountIn) = strategy.evaluate();

        if (action == StrategyAction.NONE || amountIn == 0) {
            // No rebalancing needed
            emit Swapped("None", 0, 0, 0);
            return;
        }

        address tokenIn;
        address tokenOut;

        if (action == StrategyAction.BUY) {
            tokenIn = address(depositToken);
            tokenOut = address(investToken);
        } else if (action == StrategyAction.SELL) {
            tokenIn = address(investToken);
            tokenOut = address(depositToken);
        }

        swapIfNotExcessiveSlippage(action, tokenIn, tokenOut, amountIn, true);
    }


    //////  Setter functions  /////

    function setSlippageThereshold(uint _slippage) public onlyOwner {
        slippageThereshold = _slippage;
    }

    function setStrategy(address _strategyAddress) public onlyOwner {
        strategy = IStrategy(_strategyAddress);
    }


    //////  UPKEEP FUNCTIONALITY

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory /* performData */) {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        //We highly recommend revalidating the upkeep in the performUpkeep function
        if ((block.timestamp - lastTimeStamp) > interval ) {
            lastTimeStamp = block.timestamp;
            performUpkeepCounter = performUpkeepCounter + 1;
            invest();
        }
    }


    ////// TOKEN SWAP FUNCTIONALITY

    function swapIfNotExcessiveSlippage(StrategyAction action, address _tokenIn, address _tokenOut, uint256 _amountIn, bool log) internal {

        uint256 amountMin = getAmountOutMin(_tokenIn, _tokenOut, _amountIn);

        // ensure slippage is not too much (e.g. <= 500 for a 5% slippage)
        uint slippage = slippagePercentage(_tokenIn, _tokenOut, _amountIn, amountMin);
        emit SlippageInfo(slippage, slippageThereshold, _amountIn, amountMin);

        if (slippage > slippageThereshold) {
            revert("Slippage thereshold exceeded");
        }

        uint256 depositTokenBalanceBefore = depositToken.balanceOf(address(this));
        uint256 investTokenBalanceBefore = investToken.balanceOf(address(this));

        // perform swap required to rebalance the portfolio
       swap(_tokenIn, _tokenOut, _amountIn, amountMin, address(this));

        // balances after swap
        uint256 depositTokenBalanceAfter = depositToken.balanceOf(address(this));
        uint256 investTokenBalanceAfter = investToken.balanceOf(address(this));

        uint256 spent;
        uint256 bought;
        string memory swapType;
        
        if (action == StrategyAction.BUY) {
            swapType = "BUY";
            spent = depositTokenBalanceBefore - depositTokenBalanceAfter;
            bought = investTokenBalanceAfter - investTokenBalanceBefore;
        } else if (action == StrategyAction.SELL) {
            swapType = "SELL";
            spent = investTokenBalanceBefore - investTokenBalanceAfter;
            bought = depositTokenBalanceAfter - depositTokenBalanceBefore;
        }
        if (log) { 
            logSwap(swapType, _tokenIn, _tokenOut, spent, bought);
        }

        emit Swapped(swapType, spent, bought, slippage);
    }

  

    function logSwap(string memory swapType, address tokenIn, address tokenOut, uint amountIn, uint amountOut) internal {
        
        require(priceFeed.getLatestPrice() > 0, "Invalid price");

        uint feedPrice = uint(priceFeed.getLatestPrice());
        uint pricePrecision = 10 ** uint(priceFeed.decimals());

        uint swapPrice;

        // swap USD => ETH
        if (tokenIn == address(depositToken) && tokenOut == address(investToken)) {
            uint tokenInDecimals = uint(depositToken.decimals());
            uint tokenOutDecimals = uint(investToken.decimals());
            uint amountInAdjusted = PoolLib.adjustAmountDecimals (tokenInDecimals, tokenOutDecimals, amountIn);
            swapPrice = pricePrecision * amountInAdjusted / amountOut;
        }

        // swap ETH => USD
        if (tokenIn == address(investToken) && tokenOut == address(depositToken)) {
            uint tokenInDecimals = uint(investToken.decimals());
            uint tokenOutDecimals = uint(depositToken.decimals());
            uint amountInAdjusted = PoolLib.adjustAmountDecimals (tokenInDecimals, tokenOutDecimals, amountIn);
            swapPrice = pricePrecision * amountOut / amountInAdjusted;
        }

        // Record swap info
        PoolLib.SwapInfo memory info = PoolLib.SwapInfo({
            timestamp: block.timestamp,
            side: swapType,
            feedPrice: feedPrice,
            swapPrice:swapPrice
        });

        swaps.push(info);
        swapCount = swaps.length;
    }



    function swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOutMin, address _to) internal {

        //next we need to allow the uniswapv2 router to spend the token we just sent to this contract
        //by calling IERC20 approve you allow the uniswap contract to spend the tokens in this contract
        IERC20(_tokenIn).approve(address(uniswapV2Router), _amountIn);

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == UNISWAPV2_WETH || _tokenOut == UNISWAPV2_WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = UNISWAPV2_WETH;
            path[2] = _tokenOut;
        }
        //then we will call swapExactTokensForTokens
        //for the deadline we will pass in block.timestamp
        //the deadline is the latest time the trade is valid for
        uniswapV2Router.swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );
    }

    //this function will return the minimum amount from a swap
    //input the 3 parameters below and it will return the minimum amount out
    //this is needed for the swap function above
    function getAmountOutMin(address _tokenIn, address _tokenOut, uint256 _amountIn) internal view returns (uint) {
        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == UNISWAPV2_WETH || _tokenOut == UNISWAPV2_WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = UNISWAPV2_WETH;
            path[2] = _tokenOut;
        }

        uint256[] memory amountOutMins = uniswapV2Router.getAmountsOut(_amountIn, path);
        require(amountOutMins.length >= path.length , "Invalid amountOutMins size");

        uint amountOut = amountOutMins[path.length - 1];
        return amountOut;
    }

}
