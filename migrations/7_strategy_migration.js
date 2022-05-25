
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");
const WETH = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
const DAI = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying RebalancingStrategyV1 to ", network)

  if (!network.startsWith('kovan')) {
    console.log("only for Kovan right now!")
  } else {
    console.log("deploying Pool to ", network)
    deployer.deploy(
      RebalancingStrategyV1,
      DAI, 
      WETH,
      60,   // target portfolio 60% WETH / 40% DAI
      2,    // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )
  }
};