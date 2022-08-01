
const Pool = artifacts.require("Pool");
const PoolLPToken = artifacts.require("PoolLPToken");
const TrendFollowV1 = artifacts.require("TrendFollowV1");

// UniswapV2 routers
const UNISWAP_V2_ROUTER_KOVAN = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const QUICKSWAP_V2_ROUTER_MATIC = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'

// Chainlink  ETH/USD price feeds
const ETH_USD_AGGREGATOR_KOVAN = '0x9326BFA02ADD2366b30bacB125260Af641031331'
const ETH_USD_AGGREGATOR_MATIC = '0xF9680D99D6C9589e2a93a78A04A279e509205945'

// Kovan
const DAI_KOVAN = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
const WETH_KOVAN = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const WETH_MATIC = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'

var publicChains = ['matic'];

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying Strategy ETH/USD TRENDFOLLOW to ", network)

  // if(publicChains.includes(network)) {
  //   return; //We don't want a Migrations contract on the mainnet, don't waste gas.
  // }


  if (network.startsWith('develop')) {
   
    const UniswapV2Router = artifacts.require("UniswapV2Router");

    const strategy = await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      UniswapV2Router.address,
      usdcp.address, 
      weth.address,
      40,      // movingAveragePeriod
      1303 * (10 ** 8) ,  // initialMeanValue
      20,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    await strategy.setPool(Pool.address)
    console.log("Pool address:", pool.address, "Pool is Minter: ", (await lptoken.isMinter(pool.address)) )
    
  }
  
  
  if (network.startsWith('matic')) {

    const poolAddress = '0x7BD992c32CDd03623A90992639bC7F3e817Cc21f'

    await deployer.deploy(
      TrendFollowV1,
      poolAddress,
      ETH_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WETH_MATIC,
      40,      // movingAveragePeriod
      1300 * (10 ** 8) ,  // initialMeanValue
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed(); 
    let strategyAddress = strategy.address  
    console.log("TrendFollowV1 deployed - address: ", strategyAddress)
  }
  
  
  if (network.startsWith('kovan')) {

    const poolAddress = '0xFD489dAa28239bbEa7502d0448e3c65E6e7fd915'

    await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WETH_KOVAN,
      40,      // moving average period (movingAveragePeriod)
      1303 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed();
    let strategyAddress = strategy.address
    await strategy.setPool(poolAddress)

    console.log("TrendFollowV1 deployed - address: ", strategyAddress)
  }
  

};