
const PriceConsumerV3 = artifacts.require("PriceConsumerV3");

// Network: Kovan
//  Aggregator: ETH/USD
//  Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
const ETH_USD_AGGREGATOR_KOVAN = '0x9326BFA02ADD2366b30bacB125260Af641031331'
const ETH_USD_AGGREGATOR_MATIC = '0xF9680D99D6C9589e2a93a78A04A279e509205945'

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying PriceConsumerV3 to ", network)

  if (network.startsWith('matic')) {
    deployer.deploy(PriceConsumerV3, ETH_USD_AGGREGATOR_MATIC);

  } else if (network.startsWith('kovan')) {
    deployer.deploy(PriceConsumerV3, ETH_USD_AGGREGATOR_KOVAN);
    
  } else {
    console.log("only for Kovan & Polygon (MATIC) right now!")
  }

};