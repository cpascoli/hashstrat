
const PriceConsumerV3 = artifacts.require("PriceConsumerV3");

// Chainlink  ETH/USD price feeds
const ETH_USD_AGGREGATOR_KOVAN = '0x9326BFA02ADD2366b30bacB125260Af641031331'
const ETH_USD_AGGREGATOR_MATIC = '0xF9680D99D6C9589e2a93a78A04A279e509205945'

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying PriceConsumerV3 to ", network)

  if (network.startsWith('develop')) {
    // deploy mock feed
    const USDCP = artifacts.require("USDCP");
    await deployer.deploy(USDCP, web3.utils.toWei('100000', 'mwei'));
    const usdcp = await USDCP.deployed()

    const WETH = artifacts.require("WETH");
    await deployer.deploy(WETH, web3.utils.toWei('1000', 'ether'));
    const weth = await WETH.deployed()

    const UniswapV2Router = artifacts.require("UniswapV2Router");
    await deployer.deploy(UniswapV2Router, usdcp.address, weth.address);
    const uniswap = await UniswapV2Router.deployed()

    await deployer.deploy(PriceConsumerV3, uniswap.address);

  } else if (network.startsWith('matic')) {
    await deployer.deploy(PriceConsumerV3, ETH_USD_AGGREGATOR_MATIC);
  } else if (network.startsWith('kovan')) {
    deployer.deploy(PriceConsumerV3, ETH_USD_AGGREGATOR_KOVAN);
  } else {
    console.log("only for Kovan & Polygon (MATIC) right now!")
  }
};