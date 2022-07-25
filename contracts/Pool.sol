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
    event SlippageInfo(uint slippage, uint thereshold, uint amountIn, uint amountMin);


    IERC20Metadata public immutable investToken;
    PoolLPToken public immutable lpToken;
    IPriceFeed public immutable priceFeed;

    address public immutable uniswapV2RouterAddress;
    address public strategyAddress;

    uint public upkeepInterval;
    uint public lastUpkeepTimeStamp;

    uint public slippageThereshold = 500; // allow for 5% slippage on swaps (aka should receive at least 95% of the expected token amount)
    PoolLib.SwapInfo[] public swaps;

    constructor(
        address _uniswapV2RouterAddress, 
        address _priceFeedAddress, 
        address _depositTokenAddress, 
        address _investTokenAddress, 
        address _lpTokenAddress,
        address _strategyAddress,
        uint _upkeepInterval) Wallet(_depositTokenAddress) {

        investToken = IERC20Metadata(_investTokenAddress);
        lpToken = PoolLPToken(_lpTokenAddress);
        priceFeed = IPriceFeed(_priceFeedAddress);

        uniswapV2RouterAddress = _uniswapV2RouterAddress;
        strategyAddress = _strategyAddress;

        upkeepInterval = _upkeepInterval;
        lastUpkeepTimeStamp = block.timestamp;
    }


    // returns the value of the deposit tokens in USD using the latest pricefeed price
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



    //////  PUBLIC FUNCTIONS  ////// 

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


    // percentage of the pool value held in invest tokens 
    function investTokenPercentage() public view returns (uint)  {
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

        // portfolio allocation before the deposit
        uint investTokenPerc = investTokenPercentage();

        // transfer deposit amount into the pool
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

        // mint lp tokens to the user
        lpToken.mint(msg.sender, depositLPTokens);
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
    function withdrawLP(uint amount) public virtual {
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
    }


    function getSwapsInfo() public view returns (PoolLib.SwapInfo[] memory) {
        return swaps;
    }

  
    // Returns the min amount of tokens expected from the swap and the slippage calculated as a percentage from the feed price. 
    // The returned percentage is returned with 4 digits decimals
    // E.g: For a 5% slippage below the expected amount 500 is returned
    function slippagePercentage(address tokenIn, address tokenOut, uint amountIn) public view returns (uint amountMin, uint slippage) {
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

        require(amountExpected > 0, "Invalid expected amount received after swap. It should be greater than 0 but it was not.");
       
        amountMin = getAmountOutMin(tokenIn, tokenOut, amountIn);
        if (amountMin >= amountExpected) return (amountMin, 0);

        slippage = 10000 - (10000 * amountMin / amountExpected); // e.g 10000 - 9500 = 500  (5% slippage)
    }



    function invest() public {
        // evaluate strategy to see if we should BUY or SELL
        (StrategyAction action, uint amountIn) = IStrategy(strategyAddress).evaluate();

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


    //////  UPKEEP FUNCTIONALITY  ////// 

    function checkUpkeep(bytes calldata /* checkData */) external view override returns (bool upkeepNeeded, bytes memory performData) {
       return ((block.timestamp - lastUpkeepTimeStamp) >= upkeepInterval, "");
    }

    function performUpkeep(bytes calldata /* performData */) external override {
        if ((block.timestamp - lastUpkeepTimeStamp) >= upkeepInterval ) {
            lastUpkeepTimeStamp = block.timestamp;
            invest();
        }
    }


    ////// TOKEN SWAP FUNCTIONALITY ////// 

    function swapIfNotExcessiveSlippage(StrategyAction action, address _tokenIn, address _tokenOut, uint256 _amountIn, bool log) internal {

        // ensure slippage is not too much (e.g. <= 500 for a 5% slippage)
        (uint amountMin, uint slippage) = slippagePercentage(_tokenIn, _tokenOut, _amountIn);
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
            logSwap(swapType, spent, bought);
        }

        emit Swapped(swapType, spent, bought, slippage);
    }

  
    function logSwap(string memory swapType, uint amountIn, uint amountOut) internal {
        PoolLib.SwapInfo memory info = PoolLib.swapInfo(
                swapType, amountIn, amountOut, 
                address(depositToken), address(investToken), address(priceFeed)
            );

        swaps.push(info);
    }


    function swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOutMin, address _to) internal {

        // allow the uniswapv2 router to spend the token we just sent to this contract
        IERC20(_tokenIn).approve(uniswapV2RouterAddress, _amountIn);

        // path is an array of addresses and we assume there is a direct pair btween the in and out tokens
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        // the deadline is the latest time the trade is valid for
        // for the deadline we will pass in block.timestamp
        IUniswapV2Router(uniswapV2RouterAddress).swapExactTokensForTokens(
            _amountIn,
            _amountOutMin,
            path,
            _to,
            block.timestamp
        );
    }

    // return the minimum amount from a swap
    function getAmountOutMin(address _tokenIn, address _tokenOut, uint256 _amountIn) internal view returns (uint) {
        address[] memory path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;

        uint256[] memory amountOutMins = IUniswapV2Router(uniswapV2RouterAddress).getAmountsOut(_amountIn, path);
        require(amountOutMins.length >= path.length , "Invalid amountOutMins size");

        return amountOutMins[path.length - 1];
    }


    //////  OWNER FUNCTIONS  ////// 

    function setSlippageThereshold(uint _slippage) public onlyOwner {
        slippageThereshold = _slippage;
    }

    function setStrategy(address _strategyAddress) public onlyOwner {
        strategyAddress = _strategyAddress;
    }

    function setUpkeepInterval(uint _upkeepInterval) public onlyOwner {
        upkeepInterval = _upkeepInterval;
    }

}
