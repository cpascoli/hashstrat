// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "./Pool.sol";

contract PoolV2 is Pool  {


    uint8 public immutable feesPercDecimals = 4;
    uint public feesPerc; // using feePercDecimals precision (e.g 100 is 1%)

    constructor(
        address _uniswapV2RouterAddress,
        address _priceFeedAddress,
        address _depositTokenAddress,
        address _investTokenAddress,
        address _lpTokenAddress,
        address _strategyAddress,
        uint _upkeepInterval,
        uint _feesPerc) Pool(
            _uniswapV2RouterAddress,
            _priceFeedAddress,
            _depositTokenAddress,
            _investTokenAddress,
            _lpTokenAddress,
            _strategyAddress,
            _upkeepInterval
        ) {

        feesPerc = _feesPerc;
    }


    // Withdraw an 'amount' of depositTokens from the pool after peying the fee n the gains

    function withdrawLP(uint amount) public override {

        uint fees = feesForWithdraw(amount, msg.sender);
        uint netAmount = amount - fees;

        // transfer fees to Pool by burning the and minting lptokens to the pool
        if (fees > 0) {
            lpToken.burn(msg.sender, fees);
            lpToken.mint(address(this), fees);
        }
       
        super.withdrawLP(netAmount);
    }


    // the feeds an account at address 'account' would pay to withdraw 'lpTokensAmount' LP tokens
    function feesForWithdraw(uint lpTokensAmount, address account) public view returns (uint) {
        uint precision = 10 ** uint(feesPercDecimals);
        // account has gains if their value withdrawn + their value in the pool > ther deposits
        bool haasGains =  withdrawals[account] + lpTokensValue(lpToken.balanceOf(account)) > deposits[account];
        
        return haasGains ? lpTokensAmount * feesPerc / precision  : 0;
    }


    // returns the current value of thegicen amount of lp tokens
    function lpTokensValue(uint lpAmount) public view returns (uint) {
        require (lpAmount <= lpToken.totalSupply(), "total supply exceeded");

        return this.totalPortfolioValue() * lpAmount / lpToken.totalSupply();
    }


    //////  OWNER FUNCTIONS  ////// 
    function setFeesPerc(uint _feesPerc) public onlyOwner {
        feesPerc = _feesPerc;
    }

    function withdrawFees(uint amount) public onlyOwner {
        lpToken.transfer(msg.sender, amount);
    }
}
