// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

library PoolLib {

    struct SwapInfo {
        uint timestamp;
        string side;
        uint feedPrice;
        uint bought;
        uint sold;
        uint depositTokenBalance;
        uint investTokenBalance;
    }

    function adjustAmountDecimals(uint tokenInDecimals, uint tokenOutDecimals, uint amountIn) internal pure returns (uint) {

        uint amountInAdjusted = (tokenOutDecimals >= tokenInDecimals) ?
                amountIn * (10 ** (tokenOutDecimals - tokenInDecimals)) :
                amountIn / (10 ** (tokenInDecimals - tokenOutDecimals));

        return amountInAdjusted;
    }

}