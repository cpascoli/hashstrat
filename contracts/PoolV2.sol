// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./Pool.sol";

contract PoolV2 is Pool  {

    uint8 public immutable feesPercDecimals = 4;
    uint public immutable maxFeesPerc = 200; // 2% max fees
    uint public feesPerc;                    // using feePercDecimals precision (e.g 100 is 1%)

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


    // the fees in LP tokens that an account would pay to withdraw 'lpTokensAmount' LP tokens
    // this is calcualted as percentage of the outstanding profit that the user is withdrawing
    // For example:
    //  given a 1% fees on profits,
    //  when a user having $1000 in outstaning profits is withdrawing 20% of his LP tokens
    //  then he will have to pay the LP equivalent of $2.00 in fees
    // 
    //     withdraw_value : = pool_value * lp_to_withdraw / lp_total_supply
    //     fees_value := fees_perc * gains_perc(account) * withdraw_value 
    //                := fees_perc * gains_perc(account) * pool_value * lp_to_withdraw / lp_total_supply
    //    
    //     fees_lp := fees_value * lp_total_supply / pool_value            <= fees_lp / lp_total_supply = fees_value / pool_value)
    //             := fees_perc * gains_perc(account) * pool_value * lp_to_withdraw / lp_total_supply * lp_total_supply / pool_value 
    //             := fees_perc * gains_perc(account) * lp_to_withdraw 

    function feesForWithdraw(uint lpTokensAmount, address account) public view returns (uint) {
        uint precision = 10 ** (2 * uint(feesPercDecimals));

        return feesPerc * gainsPerc(account) * lpTokensAmount / precision;
    //    return feesPerc * gainsPerc(account) * lpTokensAmount * lpToken.totalSupply() / totalPortfolioValue() / precision;
    
    }

    function gainsPerc(address account) public view returns (uint) {
        // uint feesPrecision = 10 ** uint(feesPercDecimals);
        uint valueInPool = lpTokensValue(lpToken.balanceOf(account));

        // account has gains if their value withdrawn + their value in the pool > ther deposits
        bool hasGains =  withdrawals[account] + valueInPool > deposits[account];

        // return the fees on the gains or 0 if there are no gains
        return hasGains ? 10 ** uint(feesPercDecimals) * ( withdrawals[account] + valueInPool - deposits[account] ) / deposits[account] : 0;
    }

    function lpTokensValue (uint lpTokens) public view returns (uint) {
        return lpToken.totalSupply() > 0 ? this.totalPortfolioValue() * lpTokens / lpToken.totalSupply() : 0;
    }


    //////  OWNER FUNCTIONS  ////// 
    function setFeesPerc(uint _feesPerc) public onlyOwner {
        require(_feesPerc <= maxFeesPerc, "Max fees exceeded");
        feesPerc = _feesPerc;
    }

    function withdrawFees(uint amount) public onlyOwner {
        uint fees = amount == 0 ? lpToken.balanceOf(address(this)) : amount;
        lpToken.transfer(msg.sender, fees);
    }
}
