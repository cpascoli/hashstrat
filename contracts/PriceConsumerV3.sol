// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./IPriceFeed.sol";


contract PriceConsumerV3 is IPriceFeed {

    AggregatorV3Interface internal priceFeed;

    /**
      * Chainlink pricefeed addresses.
      *
      * Aggregator: ETH/USD
      * Kovan: '0x9326BFA02ADD2366b30bacB125260Af641031331'
      * Polygon: '0xF9680D99D6C9589e2a93a78A04A279e509205945'
     */
    constructor(address _priceFeed) {
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

    function decimals() public override view returns (uint8) {
        return priceFeed.decimals();
    }
}