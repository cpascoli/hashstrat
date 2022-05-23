// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.6/interfaces/KeeperCompatibleInterface.sol";

import "./Wallet.sol";
import "./IUniswapV2Router.sol";
import "./PriceConsumerV3.sol";


contract Pool is Wallet, KeeperCompatibleInterface  {

    //address private constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    address private constant WETH = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
    // address private constant DAI = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;


    event Invested(uint amount, uint spent, uint bought);
    event Deposited(uint amount, uint depositLP, uint totalPortfolioLP);

    event WithdrawRequest(uint amount, uint percentage);
    event WithdrawInfo(uint userLP, uint lpToWithdraw, uint withdrawDepositTokensAmount, uint withdrawInvestTokensTokensAmount, uint depositTokensSwapped);
    event Withdraw(uint amount, uint lpToWithdraw, uint depositTokenWithdraw, uint allowance);

    event PriceFeed(int price);

    IERC20 internal investToken;

    /**
    * Use an interval in seconds and a timestamp to slow execution of Upkeep
    */
    uint public immutable interval;
    uint public lastTimeStamp;
    uint public counter;


    IUniswapV2Router uniswapV2Router;
    IPriceFeed priceFeed;
 

    // Accounting
    mapping (address => uint256) public portfolioLPAllocation;
    uint public totalPortfolioLP;
    
    uint immutable portFolioPercentagePrecision = 10**18; // 8 digit precision for portfolio % calculations
    uint immutable lpPrecision = 10**18;
    uint immutable public initialLPAllocation = 100 * 10**18;

    constructor(address _uniswapV2RouterAddress, address _priceFeedAddress, address _depositTokenAddress, address _investTokenAddress, uint _updateInterval) public Wallet(_depositTokenAddress) {

        investToken = IERC20(_investTokenAddress);
        uniswapV2Router = IUniswapV2Router(_uniswapV2RouterAddress);
        priceFeed = IPriceFeed(_priceFeedAddress);

        interval = _updateInterval;
        lastTimeStamp = block.timestamp;
    }

    // the LP tokens allocations to the user
    function portfolioAllocation() public view returns (uint) {
        return portfolioLPAllocation[msg.sender];
    }

    function portfolioPercentage() public view returns (uint) {
        // the % of the portfolio of the user (with 'portFolioPercentagePrecision' digits precision)
        uint portFolioPercentage = portFolioPercentagePrecision * portfolioLPAllocation[msg.sender] / totalPortfolioLP;
        return portFolioPercentage;
    }

    function portfolioValue() public view returns (uint) {
        // the value of the portfolio allocated to the user
        uint portFolioValue = totalPortfolioValue() * portfolioPercentage() / portFolioPercentagePrecision;
        return portFolioValue;
    }


    // returns the portfolio value in depositTokens
    function totalPortfolioValue() public view returns(uint) {
        uint depositTokens = depositToken.balanceOf(address(this));
        uint investTokens = investToken.balanceOf(address(this));
      
        int investTokenPrice = priceFeed.getLatestPrice();
        require (investTokenPrice >= 0, "Invest token price can't be negative");

        // portoflio value is the sum of deposit token value and invest token value
        uint value = depositTokens + (investTokens * uint(investTokenPrice));

        return value;
    }

    function latestPrice() public view returns(int) {
        return priceFeed.getLatestPrice();
    }

    // returns the deposit token balance of the pool
    function depositTokenBalance() external view returns(uint256) {
        return depositToken.balanceOf(address(this));
    }

    // returns the invest token balance of the pool
    function investTokenBalance() external view returns(uint256) {
        return investToken.balanceOf(address(this));
    }

    // User deposits 'amount' of depositTokens into the pool
    function deposit(uint amount) public override {
        super.deposit(amount);

        ///// first deposit => allocate the inital LP tokens amount to the user
        if (totalPortfolioLP == 0) {
            portfolioLPAllocation[msg.sender] = initialLPAllocation;
            totalPortfolioLP = initialLPAllocation;

            emit Deposited(amount, initialLPAllocation, totalPortfolioLP);
            return;
        }

        ///// if already have allocated LP tokens => calculate the additional LP tokens for this deposit

        // calculate portfolio % of the deposit (using lpPrecision digits precision)
        uint portFolioValue = totalPortfolioValue();
        uint portFolioPercentage = lpPrecision * amount / portFolioValue;

        // calculate the amount of LP tokens for the deposit so that they represent 
        // a % of the existing LP tokens equivalent to the % value of this deposit to the whole portfolio value.
        // 
        // X := P * T / (1 - P)  
        //      X: additinal LP toleks to allocate to the user to account for this deposit
        //      P: Percentage of portfolio accounted by this deposit
        //      T: total LP tokens allocated before this deposit
  
        uint depositLPTokens = (portFolioPercentage * totalPortfolioLP) / ((1 * lpPrecision) - portFolioPercentage);

        portfolioLPAllocation[msg.sender] = portfolioLPAllocation[msg.sender] + depositLPTokens;
        totalPortfolioLP = totalPortfolioLP + depositLPTokens;

        emit Deposited(amount, depositLPTokens, totalPortfolioLP);

    }

    // Withdraw 'amount' of depositTokens from the pool
    function withdraw(uint amount) public override {

        require (amount > 0, "Amount to withdraw should be > 0");

        // Ensure the user account has enough funds in the Pool
        uint pv = portfolioValue(); // the value of the user portfolio
        require (pv >= amount, "Withdrawal limits exceeded");

        // uint userPortfolioPerc = portfolioPercentage();  // includes portFolioPercentagePrecision digits

        // the % of the whole pool to be withdrawn
        uint withdrawPerc = portFolioPercentagePrecision * amount / totalPortfolioValue();

        emit WithdrawRequest(amount, withdrawPerc);

        // calculte the user LP amount to be deduced  
        uint userLP = portfolioLPAllocation[msg.sender];
        uint lpToWithdraw = totalPortfolioLP * withdrawPerc / portFolioPercentagePrecision;

        require (lpToWithdraw > 0, "LP to withdraw can't be 0");
        require (userLP >= lpToWithdraw, "LP to withdraw can't be more than account amount");
        require (totalPortfolioLP >= lpToWithdraw, "LP to withdraw can't be more than portfolio amount");


        // reduce user LP allocation
        portfolioLPAllocation[msg.sender] = userLP - lpToWithdraw;
        totalPortfolioLP = totalPortfolioLP - lpToWithdraw;

        // calculate amount of depositTokens & investTokens to withdraw
        uint depositTokens = depositToken.balanceOf(address(this));
        uint investTokens = investToken.balanceOf(address(this));

        uint withdrawDepositTokensAmount = depositTokens * withdrawPerc / portFolioPercentagePrecision;
        uint withdrawInvestTokensTokensAmount = investTokens * withdrawPerc / portFolioPercentagePrecision;

        if (withdrawInvestTokensTokensAmount > 0) {
            // swap quota of investTokens for this withdraw
            uint256 amountMin = getAmountOutMin(address(investToken), address(depositToken), withdrawInvestTokensTokensAmount);
            swap(address(investToken), address(depositToken), withdrawInvestTokensTokensAmount, amountMin, address(this));
        }

        // determine how much depositTokens where received
        uint depositTokensAfterSwap = depositToken.balanceOf(address(this));
        require(depositTokensAfterSwap >= depositTokens, "Deposit tokens after swap should not be less than amount before the swap");
        uint depositTokensSwapped = depositTokensAfterSwap - depositTokens;

        emit WithdrawInfo(userLP, lpToWithdraw, withdrawDepositTokensAmount, withdrawInvestTokensTokensAmount, depositTokensSwapped);


        // transfer depositTokens to user
        uint depositTokenWithdraw = withdrawDepositTokensAmount + depositTokensSwapped;
        
        uint allowance = depositToken.allowance(address(this), msg.sender);
        depositToken.transfer(msg.sender, depositTokenWithdraw);

        emit Withdraw(amount, lpToWithdraw, depositTokenWithdraw, allowance);
    }




    /// INVESTMENT STRATEGY

    function invest() public {

        uint256 depositTokenBalanceBefore = depositToken.balanceOf(address(this));
        uint256 investTokenBalanceBefore = investToken.balanceOf(address(this));

        // Spend 10% of available depositTokens
        uint256 amount = depositTokenBalanceBefore / 10;

        // perform swap
        uint256 amountMin = getAmountOutMin(address(depositToken), address(investToken), amount);
        swap(address(depositToken), address(investToken), amount,amountMin, address(this));

        uint256 depositTokenBalanceAfter = depositToken.balanceOf(address(this));
        uint256 investTokenBalanceAfter = investToken.balanceOf(address(this));

        uint256 spent = depositTokenBalanceBefore - depositTokenBalanceAfter;
        uint256 bought = investTokenBalanceAfter - investTokenBalanceBefore;

        emit Invested(amount, spent, bought);
    }


    /// TOKEN SWAP FUNCTIONALITY

    function swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _amountOutMin,address _to) internal {

        //next we need to allow the uniswapv2 router to spend the token we just sent to this contract
        //by calling IERC20 approve you allow the uniswap contract to spend the tokens in this contract
        IERC20(_tokenIn).approve(address(uniswapV2Router), _amountIn);

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
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
    function getAmountOutMin(address _tokenIn, address _tokenOut, uint256 _amountIn) internal view returns (uint256) {
        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WETH || _tokenOut == WETH) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = _tokenOut;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WETH;
            path[2] = _tokenOut;
        }

        uint256[] memory amountOutMins = uniswapV2Router.getAmountsOut(_amountIn, path);
        require(amountOutMins.length >= path.length , "Invalid amountOutMins size");

        return amountOutMins[path.length - 1];
    }


    // UPKEEP FUNCTIONALITY
    function checkUpkeep(bytes calldata /* checkData */) external override returns (bool upkeepNeeded, bytes memory /* performData */) {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
        // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
    }


    function performUpkeep(bytes calldata /* performData */) external override {
        //We highly recommend revalidating the upkeep in the performUpkeep function
        if ((block.timestamp - lastTimeStamp) > interval ) {
            lastTimeStamp = block.timestamp;
            counter = counter + 1;
            invest();
        }
        // We don't use the performData in this example. The performData is generated by the Keeper's call to your checkUpkeep function
    }

}
