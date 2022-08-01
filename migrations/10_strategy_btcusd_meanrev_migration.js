

const MeanReversionV1 = artifacts.require("MeanReversionV1");

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const WBTC_MATIC = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6'

// Chainlink  BTC/USD price feeds
const BTC_USD_AGGREGATOR_KOVAN = '0x6135b13325bfC4B00278B4abC5e20bbce2D6580e'
const BTC_USD_AGGREGATOR_MATIC = '0xc907E116054Ad103354f2D350FD2514433D57F6f'


var publicChains = ['matic'];

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying Strategy BTC/USD MeanReversionV1 to ", network)

  // if(publicChains.includes(network)) {
  //   return; //We don't want a Migrations contract on the mainnet, don't waste gas.
  // }


  if (network.startsWith('develop')) {
    const UniswapV2Router = artifacts.require("UniswapV2Router");

    const strategy =  await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      UniswapV2Router.address,
      usdcp.address, 
      wbtc.address,
      350,      // moving average period (movingAveragePeriod)
      42185 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    await strategy.setPool(pool.address)
  }
  
  
  if (network.startsWith('matic')) {

    const poolAddress = '0x759c4948227633337A7d0f53d71bf26B89E11660'

    await deployer.deploy(
      MeanReversionV1,
      poolAddress,
      BTC_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WBTC_MATIC,
      350,      // moving average period (movingAveragePeriod)
      42185 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    let strategy = await MeanReversionV1.deployed(); 
    let strategyAddress = strategy.address  
    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    // await pool.setStrategy(strategyAddress)
  }
  
  
  if (network.startsWith('kovan')) {

    const poolAddress = '0xa290dC3e5936064F784040Bef6869c558082ECCC'

    await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_KOVAN,
      USDC_MATIC, 
      WBTC_MATIC,
      350,      // moving average period (movingAveragePeriod)
      42185 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed();
    let strategyAddress = strategy.address

    await strategy.setPool(poolAddress)

    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    // console.log("Pool is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  

};