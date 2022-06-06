
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");
const PriceConsumerV3 = artifacts.require("PriceConsumerV3");

// Kovan
const DAI_KOVAN = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
const WETH_KOVAN = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const WETH_MATIC = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying RebalancingStrategyV1 to ", network)

  if (network.startsWith('develop')) {
   
    const USDCP = artifacts.require("USDCP");
    const WETH = artifacts.require("WETH");
    const weth = await WETH.deployed()
    const usdcp = await USDCP.deployed()
    const pricefeed = await PriceConsumerV3.deployed()

    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      pricefeed.address,
      usdcp.address, 
      weth.address,
      60,   // target portfolio 60% WETH / 40% USDC
      2,    // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )
    console.log("RebalancingStrategyV1 deploying to ", network)
    
  } else if (network.startsWith('matic')) {
    const pricefeed = await PriceConsumerV3.deployed()
    
    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      pricefeed.address,
      USDC_MATIC, 
      WETH_MATIC,
      60,   // target portfolio 60% WETH / 40% USDC
      2,    // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )
  } else if (network.startsWith('kovan')) {
    const pricefeed = await PriceConsumerV3.deployed()
    
    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      pricefeed.address,
      DAI_KOVAN, 
      WETH_KOVAN,
      60,   // target portfolio 60% WETH / 40% DAI
      2,    // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )
  } else {
    console.log("only for Kovan & Polygon (MATIC) right now!")
  }
};