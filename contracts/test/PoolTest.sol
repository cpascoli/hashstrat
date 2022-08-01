// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../Pool.sol";

contract PoolTest is Pool  {

    constructor(
        address _uniswapV2RouterAddress,
        address _priceFeedAddress,
        address _depositTokenAddress,
        address _investTokenAddress,
        address _lpTokenAddress,
        address _strategyAddress,
        uint _upkeepInterval) Pool (
            _uniswapV2RouterAddress,
            _priceFeedAddress,
            _depositTokenAddress,
            _investTokenAddress,
            _lpTokenAddress,
            _strategyAddress,
            _upkeepInterval
    ) {}


    function investTest() public {
        super.invest();
    }

}
