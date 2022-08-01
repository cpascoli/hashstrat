
const PoolV2 = artifacts.require("PoolV2");
const PoolLPToken = artifacts.require("PoolLPToken");
const MeanReversionV1 = artifacts.require("MeanReversionV1");

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

  console.log("deploying Pool BTC/USD MEANREV to ", network)

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
    const lptoken = await deployer.deploy(PoolLPToken, "HashStrat LP (BTCUSD 60/40)", "BTCUSD6040", 6)

    const strategy = await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      uniswap.address, //pricefed
      usdcp.address, 
      wbtc.address,
      350,      // moving average period (movingAveragePeriod)
      3014 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    const pool = await deployer.deploy(Pool, 
      uniswap.address, 
      uniswap.address, // pricefeed
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

    // const strategyAddress = '0xD4A23E904Ca222761d4DCC0A3BD7E9f9cA80dC7c'
    // const lptokenAddress = '0xe28fa2B87BFbCbFeCa92A691667a5E4a93CC3f17'
    // const poolAddress = '0x759c4948227633337A7d0f53d71bf26B89E11660'

    await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
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
    console.log("MeanReversionV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - BTCUSD MEANREV1", "BTCUSDMR01", 6)
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
      5 * 24 * 60 * 60, // run strategy every 5 days
      100               // 1% fees 
    )

    let pool = await PoolV2.deployed();
    let poolAddress = pool.address
    console.log("PoolV2 deployed - address: ", poolAddress)
    
    await lptoken.addMinter(poolAddress)
    await strategy.setPool(poolAddress)
    //await lptoken.renounceMinter()

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  
  
  if (network.startsWith('kovan')) {

    // const strategyAddress = '0x60D51e221F3e3306BD29012B3e3d5cFcfF74997d'
    // const lptokenAddress = '0x9F6352d15d434eCAFB26B7Cbc60Eb6F92b518DA4'
    // const poolAddress = '0x22A31eCE45A9dAF63FeBdAf22C9ed662236C7b0F'

    await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WBTC_KOVAN,
      350,      // moving average period (movingAveragePeriod)
      42185 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    let strategy = await MeanReversionV1.deployed();
    let strategyAddress = strategy.address
    console.log("MeanReversionV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - BTCUSD MEANREV1", "BTCUSDMR01", 18)
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
      5 * 24 * 60 * 60, // run strategy every 5 days
      100               // 1% fees 
    )
    let pool = await PoolV2.deployed();
    let poolAddress = pool.address
    console.log("PoolV2 deployed - address: ", poolAddress)

    await pool.setSlippageThereshold(9999)
      
    await lptoken.addMinter(poolAddress)
    //await lptoken.renounceMinter()
    await strategy.setPool(poolAddress)

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  

};