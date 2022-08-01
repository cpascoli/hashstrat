
const PoolV2 = artifacts.require("PoolV2");
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

  console.log("deploying Pool ETH/USD TRENDFOLLOW to ", network)

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

    // const strategyAddress = '0xA63ef860658eE67c9a194948d1e0bD495fee28c7'
    // const lptokenAddress = '0xB995C1b6bb43139aE1B2B682DB5B4287667Fcd7F'
    // const poolAddress = '0x574b983b13A42FbA0788e3AE829553913Fdc5879'


    await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WETH_MATIC,
      40,      // movingAveragePeriod
      1277 * (10 ** 8) ,  // initialMeanValue
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed(); 
    let strategyAddress = strategy.address  
    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSDTF01", "ETHUSDTF01", 6)
    let lptoken = await PoolLPToken.deployed();
    let lptokenAddress = lptoken.address
    console.log("PoolLPToken deployed - address: ", lptokenAddress)

    await deployer.deploy(PoolV2,
      QUICKSWAP_V2_ROUTER_MATIC,
      ETH_USD_AGGREGATOR_MATIC,
      USDC_MATIC,
      WETH_MATIC,
      lptokenAddress,
      strategyAddress,
      5 * 24 * 60 * 60,  // run strategy every 5 days
      100                // 1% fees
    )

    let pool = await PoolV2.deployed();
    let poolAddress = pool.address
    console.log("PoolV2 deployed - address: ", poolAddress)
    
    await strategy.setPool(poolAddress)
    await lptoken.addMinter(poolAddress)
    // //await lptoken.renounceMinter()

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  
  
  if (network.startsWith('kovan')) {

    // const strategyAddress = '0x7B7D7523779885A5CD5275c68abB0eABCf14C55d'
    // const lptokenAddress = '0x1cc917Cf9d2cb963dfcCC22F26F005d3e74971F4'
    // const poolAddress = '0xfad00c74F9Db9696359576AC52D94de260B1aF6b'

    await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WETH_KOVAN,
      40,      // moving average period (movingAveragePeriod)
      1277 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      10,      // minAllocationPerc
      0,       // targetPricePercUp
      0,       // targetPricePercDown
      100,     // tokensToSwapPerc
    )

    let strategy = await TrendFollowV1.deployed();
    let strategyAddress = strategy.address
    console.log("TrendFollowV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSD TF01", "ETHUSDTF01", 18)
    let lptoken = await PoolLPToken.deployed();
    let lptokenAddress = lptoken.address
    console.log("PoolLPToken deployed - address: ", lptokenAddress)

    await deployer.deploy(PoolV2, 
      UNISWAP_V2_ROUTER_KOVAN, 
      ETH_USD_AGGREGATOR_KOVAN, 
      DAI_KOVAN,
      WETH_KOVAN,
      lptokenAddress, 
      strategyAddress,
      5 * 24 * 60 * 60,  // run strategy every 5 days
      100                // 1% fees
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