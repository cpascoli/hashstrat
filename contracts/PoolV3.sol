// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./Pool.sol";
import "./IDAOTokenFarm.sol";


/**
 * Owner of this contract should be DAOOperations
 */
contract PoolV3 is Pool  {

    uint8 public immutable feesPercDecimals = 4;
    uint public feesPerc;                    // using feePercDecimals precision (e.g 100 is 1%)

    IDAOTokenFarm public daoTokenFarm;

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

    function feesForWithdraw(uint lpToWithdraw, address account) public view returns (uint) {

        return feesPerc * gainsPerc(account) * lpToWithdraw / (10 ** (2 * uint(feesPercDecimals)));    
    }


    function gainsPerc(address account) public view returns (uint) {
        // if the address has no deposits (e.g. LPs were transferred from original depositor)
        // then consider the entire LP value as gains.
        // This is to prevent tax avoidance by withdrawing the LPs to different addresses
        if (deposits[account] == 0) return 10 ** uint(feesPercDecimals); // 100% gains

        //  account for staked LPs
        uint stakedLP = address(daoTokenFarm) != address(0) ? daoTokenFarm.getStakedBalance(account, address(lpToken)) : 0;
        uint valueInPool = lpTokensValue(lpToken.balanceOf(account) + stakedLP);

        // check if accounts is in gain
        bool hasGains = withdrawals[account] + valueInPool > deposits[account];

        // return the fees on the gains or 0 if there are no gains
        return hasGains ? 10 ** uint(feesPercDecimals) * ( withdrawals[account] + valueInPool - deposits[account] ) / deposits[account] : 0;
    }


    function lpTokensValue (uint lpTokens) public view returns (uint) {
        return lpToken.totalSupply() > 0 ? this.totalValue() * lpTokens / lpToken.totalSupply() : 0;
    }


    //////  OWNER FUNCTIONS  ////// 
    function setFeesPerc(uint _feesPerc) public onlyOwner {
        feesPerc = _feesPerc;
    }

    function setFarmAddress(address farmAddress) public onlyOwner {
        daoTokenFarm = IDAOTokenFarm(farmAddress);
    }

    // Withdraw the given amount of LP token fees in deposit tokens
    function collectFees(uint amount) public onlyOwner {
        uint fees = amount == 0 ? lpToken.balanceOf(address(this)) : amount;
        if (fees > 0) {
            lpToken.transfer(msg.sender, fees);
            super.withdrawLP(fees);
        }
    }

}
