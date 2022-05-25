
const PriceConsumerV3 = artifacts.require("PriceConsumerV3");

// Network: Kovan
//  Aggregator: ETH/USD
//  Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
const ETH_USD_AGGREGATOR = '0x9326BFA02ADD2366b30bacB125260Af641031331'

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying PriceConsumerV3 to ", network)

  if (!network.startsWith('kovan')) {
    console.log("only for Kovan right now!")
  } else {
    deployer.deploy(PriceConsumerV3, ETH_USD_AGGREGATOR);
  }
};