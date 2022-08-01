
const PoolV2 = artifacts.require("PoolV2");
const PoolLPToken = artifacts.require("PoolLPToken");
const MeanReversionV1 = artifacts.require("MeanReversionV1");

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

  console.log("deploying Pool ETH/USD MEANREV to ", network)

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
      UniswapV2Router.address, // pricefeed
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

    // const strategyAddress = '0x01A82D2705F10eB1A9DF2cF57C8eECE105072aF7'
    // const lptokenAddress = '0x532B213E4f04dC22E507F147602F9de99b8EfEe4'
    // const poolAddress = '0x3c9fe4F73173f7869Db4FCF6bAc17896B7E15286'

    await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WETH_MATIC,
      350,      // moving average period (movingAveragePeriod)
      2990 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    let strategy = await MeanReversionV1.deployed(); 
    let strategyAddress = strategy.address  
    console.log("MeanReversionV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSD MEANREV1", "ETHUSDMR01", 6)
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

    // const strategyAddress = '0x60feC7B847b2d30BA391F51E54Bea32f604F47c6'
    // const lptokenAddress = '0x2F5c5e749DF2cC05676c9deBb2Cb7256042feF04'
    // const poolAddress = '0x0A09Ed4c246845C586670469DCd4D9E08A938A06'

    await deployer.deploy(
      MeanReversionV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WETH_MATIC,
      350,      // moving average period (movingAveragePeriod)
      2990 * (10 ** 8) ,  // initial MV value (initialMeanValue)
      20,       // minAllocationPerc
      66,       // targetPricePercUp
      33,       // targetPricePercDown
      5,        // tokensToSwapPerc
    )

    let strategy = await MeanReversionV1.deployed();
    let strategyAddress = strategy.address
    console.log("MeanReversionV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSD MEANREV1", "ETHUSDMR01", 18)
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
      5 * 24 * 60 * 60, // run strategy every 5 days
      100               // 1% fees
    )
    let pool = await PoolV2.deployed();
    let poolAddress = pool.address
    console.log("PoolV2 deployed - address: ", poolAddress)

    await pool.setSlippageThereshold(9999)
      
    await lptoken.addMinter(poolAddress)
    ////await lptoken.renounceMinter()
    await strategy.setPool(poolAddress)

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(poolAddress)) )
  }
  

};