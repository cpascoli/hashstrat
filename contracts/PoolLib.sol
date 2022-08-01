// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


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

    function swapInfo(string memory swapType,
        uint amountIn, uint amountOut,
        address depositTokenAddress, address investTokenAddress, address priceFeedAddress) internal view returns (SwapInfo memory) {

        (   /*uint80 roundID**/, int price, /*uint startedAt*/,
            /*uint timeStamp*/, /*uint80 answeredInRound*/
        ) = AggregatorV3Interface(priceFeedAddress).latestRoundData();

        require(price > 0, "Invalid price");

        IERC20Metadata depositToken = IERC20Metadata(depositTokenAddress);
        IERC20Metadata investToken = IERC20Metadata(investTokenAddress);
        
        // Record swap info
        PoolLib.SwapInfo memory info = PoolLib.SwapInfo({
            timestamp: block.timestamp,
            side: swapType,
            feedPrice: uint(price),
            bought: amountOut,
            sold: amountIn,
            depositTokenBalance: depositToken.balanceOf(address(this)),
            investTokenBalance: investToken.balanceOf(address(this))
        });

        return info;
    }
}