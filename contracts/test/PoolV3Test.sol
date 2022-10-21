// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../PoolV3.sol";

contract PoolV3Test is PoolV3  {

    constructor(
        address _uniswapV2RouterAddress,
        address _priceFeedAddress,
        address _depositTokenAddress,
        address _investTokenAddress,
        address _lpTokenAddress,
        address _strategyAddress,
        uint _upkeepInterval,
        uint _feesPerc) PoolV3(
            _uniswapV2RouterAddress,
            _priceFeedAddress,
            _depositTokenAddress,
            _investTokenAddress,
            _lpTokenAddress,
            _strategyAddress,
            _upkeepInterval,
            _feesPerc
    ) {}


    function investTest() public {
        super.invest();
    }

}
