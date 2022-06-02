
const Pool = artifacts.require("Pool");
const PriceConsumerV3 = artifacts.require("PriceConsumerV3");
const PoolLPToken = artifacts.require("PoolLPToken");
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

const UNISWAP_V2_ROUTER_KOVAN = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const QUICKSWAP_V2_ROUTER_MATIC = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'

// Kovan
const DAI_KOVAN = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
const WETH_KOVAN = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const WETH_MATIC = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'


module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying Pool to ", network)

  if (network.startsWith('develop')) {
   
    const UniswapV2Router = artifacts.require("UniswapV2Router");
    const USDCP = artifacts.require("USDCP");
    const WETH = artifacts.require("WETH");

    const uniswap = await UniswapV2Router.deployed()
    const pricefeed = await PriceConsumerV3.deployed()
    const weth = await WETH.deployed()
    const usdcp = await USDCP.deployed()
    const lptoken = await PoolLPToken.deployed()
    const strategy = await RebalancingStrategyV1.deployed()

    await deployer.deploy(Pool, 
      uniswap.address, 
      pricefeed.address, 
      usdcp.address, 
      weth.address, 
      lptoken.address, 
      strategy.address,
      24 * 60 * 60 // run strategy once a day
    )

    const pool = await Pool.deployed()
    await lptoken.addMinter(pool.address)
    //await lptoken.renounceMinter()

    console.log("Pool is Minter: ", (await lptoken.isMinter(pool.address)) )
    
  } else if (network.startsWith('matic')) {

    const lptoken = await PoolLPToken.deployed()
    const strategy = await RebalancingStrategyV1.deployed()

    await deployer.deploy(Pool, 
      QUICKSWAP_V2_ROUTER_MATIC, 
      PriceConsumerV3.address, 
      USDC_MATIC, 
      WETH_MATIC, 
      lptoken.address, 
      strategy.address,
      24 * 60 * 60 // run strategy once a day
    )

    const pool = await Pool.deployed()
    await lptoken.addMinter(pool.address)
    //await lptoken.renounceMinter()

    console.log("Pool is Minter: ", (await lptoken.isMinter(pool.address)) )

  } else if (network.startsWith('kovan')) {

    const lptoken = await PoolLPToken.deployed()
    const strategy = await RebalancingStrategyV1.deployed()

    await deployer.deploy(Pool, 
      UNISWAP_V2_ROUTER_KOVAN, 
      PriceConsumerV3.address, 
      DAI_KOVAN, 
      WETH_KOVAN, 
      lptoken.address, 
      strategy.address,
      24 * 60 * 60 // run strategy once a day
    )

    const pool = await Pool.deployed()
    await lptoken.addMinter(pool.address)
    await lptoken.renounceMinter()

    console.log("Pool is Minter: ", (await lptoken.isMinter(pool.address)) )
  } else {
    console.log("only for Kovan & Polygon (MATIC) right now!")
  }

};