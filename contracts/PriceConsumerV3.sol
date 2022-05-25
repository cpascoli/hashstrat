// This example code is designed to quickly deploy an example contract using Remix.

pragma solidity ^0.6.6;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

interface IPriceFeed {
    function getLatestPrice() external view returns (int);
    function getLatestTimestamp() external view returns (uint);
    function decimals() external view returns (uint);
}


contract PriceConsumerV3 is IPriceFeed {

    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
     */
    constructor(address _priceFeed) public {
        //priceFeed = AggregatorV3Interface(0x9326BFA02ADD2366b30bacB125260Af641031331);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public override view returns (int) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();

        return price;
    }

    /**
     * Returns the latest price
     */
    function getLatestTimestamp() public override view returns (uint) {
        (
            /*uint80 roundID*/,
            /*int price*/,
            /*uint startedAt*/,
            uint timeStamp,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();

        return timeStamp;
    }

    function decimals() public override view returns (uint) {
        return priceFeed.decimals();
    }
}