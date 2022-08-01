
const Pool = artifacts.require("Pool");
const PoolLPToken = artifacts.require("PoolLPToken");
const TrendFollowV1 = artifacts.require("TrendFollowV1");

// Chainlink  BTC/USD price feeds
const BTC_USD_AGGREGATOR_KOVAN = '0x6135b13325bfC4B00278B4abC5e20bbce2D6580e'
const BTC_USD_AGGREGATOR_MATIC = '0xc907E116054Ad103354f2D350FD2514433D57F6f'

// Kovan
const DAI_KOVAN = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
const WBTC_KOVAN = '0xe0C9275E44Ea80eF17579d33c55136b7DA269aEb'

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const WBTC_MATIC = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'


var publicChains = ['matic'];

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying Strategy BTC/USD TRENDFOLLOW to ", network)

  // if(publicChains.includes(network)) {
  //   return; //We don't want a Migrations contract on the mainnet, don't waste gas.
  // }


  if (network.startsWith('develop')) {
    const strategy = await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      pricefeed.address,
      usdcp.address, 
      wbtc.address,
      40,      // movingAveragePeriod
      1303 * (10 ** 8) ,  // initialMeanValue
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    await strategy.setPool(pool.address)
  }
  
  
  if (network.startsWith('matic')) {

    // const strategyAddress = '0x051b490211B50Df68D42f3074D6dC4d94F8A6d15'
    // const lptokenAddress = '0x0A09Ed4c246845C586670469DCd4D9E08A938A06'
    const poolAddress = '0xAb8Bb099447C1A6A9054bD9467e56d5e5304ceB6'

    await deployer.deploy(
      TrendFollowV1,
      poolAddress,
      BTC_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WBTC_MATIC,
      40,      // movingAveragePeriod
      22509 * (10 ** 8) ,  // initialMeanValue
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed(); 
    let strategyAddress = strategy.address  
    // await strategy.setPool(poolAddress)

    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

  }
  
  
  if (network.startsWith('kovan')) {

    // const strategyAddress = '0x676EC78cbf25f347C039c951B93C04435be16fC0'
    // const lptokenAddress = '0x397841AaF3ad9d4149e7a728E23a981FC7A551Dc'
    const poolAddress = '0xa290dC3e5936064F784040Bef6869c558082ECCC'

    await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WBTC_KOVAN,
      40,      // moving average period (movingAveragePeriod)
      1303 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed();
    let strategyAddress = strategy.address

    await strategy.setPool(poolAddress)

    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    // console.log("Pool is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  

};