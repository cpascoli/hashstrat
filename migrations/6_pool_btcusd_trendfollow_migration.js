
const PoolV2 = artifacts.require("PoolV2");
const PoolLPToken = artifacts.require("PoolLPToken");
const TrendFollowV1 = artifacts.require("TrendFollowV1");


// UniswapV2 routers
const UNISWAP_V2_ROUTER_KOVAN = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const QUICKSWAP_V2_ROUTER_MATIC = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'

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

  console.log("deploying Pool BTC/USD TRENDFOLLOW to ", network)

  // if(publicChains.includes(network)) {
  //   return; //We don't want a Migrations contract on the mainnet, don't waste gas.
  // }


  if (network.startsWith('develop')) {
   
    const USDCP = artifacts.require("USDCP");
    const WBTC = artifacts.require("WBTC");
    const UniswapV2Router = artifacts.require("UniswapV2Router");

    const usdcp = await deployer.deploy(USDCP, web3.utils.toWei('100000', 'mwei'));
    const wbtc = await deployer.deploy(WBTC, web3.utils.toWei('100000', 'mwei'));
    const uniswap = await deployer.deploy(UniswapV2Router, usdcp.address, wbtc.address);
    const lptoken = await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSD TF01", "ETHUSDTF01", 6)
  
 
    const strategy = await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      uniswap.address, // pricefeed
      usdcp.address, 
      wbtc.address,
      40,      // movingAveragePeriod
      1303 * (10 ** 8) ,  // initialMeanValue
      20,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    const pool = await deployer.deploy(Pool, 
      uniswap.address, 
      pricefeed.address, 
      usdcp.address, 
      wbtc.address, 
      lptoken.address, 
      strategy.address,
      24 * 60 * 60 // run strategy once a day
    )

    await lptoken.addMinter(pool.address)
    await lptoken.renounceMinter()

    await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
    await strategy.setPool(pool.address)

    console.log("Pool address:", pool.address, "Pool is Minter: ", (await lptoken.isMinter(pool.address)) )
    
  }
  
  
  if (network.startsWith('matic')) {

    // const strategyAddress = '0x050851b64fd4E81AB1b78c0bd16B14c92C9327d7'
    // const lptokenAddress = '0x81f219E6CDb60b12CD07b8457A43630050572122'
    // const poolAddress = '0xa290591BB6606BB0cE71790eC19b83A311e6CcaE'

    await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WBTC_MATIC,
      40,      // movingAveragePeriod
      21685 * (10 ** 8) ,  // initialMeanValue
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed(); 
    let strategyAddress = strategy.address  
    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - BTCUSDTF01", "BTCUSDTF01", 6)
    let lptoken = await PoolLPToken.deployed();
    let lptokenAddress = lptoken.address
    console.log("PoolLPToken deployed - address: ", lptokenAddress)

    await deployer.deploy(PoolV2,
      QUICKSWAP_V2_ROUTER_MATIC,
      BTC_USD_AGGREGATOR_MATIC,
      USDC_MATIC,
      WBTC_MATIC,
      lptokenAddress,
      strategyAddress,
      5 * 24 * 60 * 60,  // run strategy every 5 days
      100                // 1% fees
    )

    let pool = await PoolV2.deployed();
    let poolAddress = pool.address
    console.log("PoolV2 deployed - address: ", poolAddress)
    
    await lptoken.addMinter(poolAddress)
    await strategy.setPool(poolAddress)
    // //await lptoken.renounceMinter()

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  
  
  if (network.startsWith('kovan')) {
    // const strategyAddress = '0xCE3bA97EaF0339e58B593424F692A5D97C3Ef8e5'
    // const lptokenAddress = '0x1f7E57F40121eF766061CE3965cB5F77da35298b'
    // const poolAddress = '0x5A603B034534A13996287bD91D417085Ab7e9a86'

    await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WBTC_KOVAN,
      40,      // moving average period (movingAveragePeriod)
      21685 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed();
    let strategyAddress = strategy.address
    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - BTCUSDTF01", "BTCUSDTF01", 18)
    let lptoken = await PoolLPToken.deployed();
    let lptokenAddress = lptoken.address
    console.log("PoolLPToken deployed - address: ", lptokenAddress)

    await deployer.deploy(PoolV2, 
      UNISWAP_V2_ROUTER_KOVAN, 
      BTC_USD_AGGREGATOR_KOVAN, 
      DAI_KOVAN,
      WBTC_KOVAN,
      lptokenAddress, 
      strategyAddress,
      5 * 24 * 60 * 60,  // run strategy every 5 days
      100               // 1% fees
    )
    let pool = await PoolV2.deployed();
    let poolAddress = pool.address
    console.log("PoolV2 deployed - address: ", poolAddress)

    await pool.setSlippageThereshold(9999)
      
    // await lptoken.addMinter(poolAddress)
    // ////await lptoken.renounceMinter()
    // await strategy.setPool(poolAddress)

    // console.log("Pool is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  

};