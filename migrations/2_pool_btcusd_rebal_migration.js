
const PoolV2 = artifacts.require("PoolV2");
const PoolLPToken = artifacts.require("PoolLPToken");
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");


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

  console.log("deploying PoolV2 REB BTC/USD 60/40 to ", network)


  if (network.startsWith('develop')) {
   
    const USDCP = artifacts.require("USDCP");
    const WBTC = artifacts.require("WBTC");
    const UniswapV2Router = artifacts.require("UniswapV2Router");

    const usdcp = await deployer.deploy(USDCP, web3.utils.toWei('100000', 'mwei'));
    const wbtc = await deployer.deploy(WBTC, web3.utils.toWei('100000', 'mwei'));
    const uniswap = await deployer.deploy(UniswapV2Router, usdcp.address, wbtc.address);
    const lptoken = await deployer.deploy(PoolLPToken, "HashStrat LP (BTCUSD 60/40)", "BTCUSD6040", 6)

    const strategy = await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      uniswap.address, // pricefeed
      usdcp.address, 
      wbtc.address,
      60,   // target portfolio 60% WBTC / 40% USDC
      2,    // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )

    const pool = await deployer.deploy(PoolV2, 
      uniswap.address, 
      uniswap.address,  // pricefeed
      usdcp.address, 
      wbtc.address, 
      lptoken.address, 
      strategy.address,
      5 * 24 * 60 * 60 // run strategy every 5 days
    )

    await lptoken.addMinter(pool.address)
    await lptoken.renounceMinter()

    await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
    await strategy.setPool(pool.address)

    console.log("Pool address:", pool.address, "Pool is Minter: ", (await lptoken.isMinter(pool.address)) )
    
  }
  
  
  if (network.startsWith('matic')) {

    // const strategyAddress = '0xCa548B32c9DA8F88fE02b5860baFB66DD0BB0f1b'
    // const lptokenAddress = '0xAE013eD73fc72f4361aECed322612A973fd36085'
    // const poolAddress = '0x5F7621d43fa646C3e7838266DD12ccCb390Dc933'

    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WBTC_MATIC,
      60,   // target portfolio 60% WBTC / 40% USDC
      10,   // 10% seems a good rebalancing band that requires price to double or halve to rebalance
    )
    let strategy = await RebalancingStrategyV1.deployed(); 
    let strategyAddress = strategy.address   // 0x40aF5D4EbD51B78f55D230745D5D4C96DC939F59
    console.log("RebalancingStrategyV1 deployed - address: ", strategyAddress)

    await deployer.deploy(PoolLPToken, "HashStrat LP - BTCUSD REB1 60/40", "BTCUSDR164", 6)
    let lptoken = await PoolLPToken.deployed();  // 0x397841AaF3ad9d4149e7a728E23a981FC7A551Dc
    let lptokenAddress = lptoken.address
    console.log("PoolLPToken deployed - address: ", lptokenAddress)

    await deployer.deploy(PoolV2, 
      QUICKSWAP_V2_ROUTER_MATIC, 
      BTC_USD_AGGREGATOR_MATIC, 
      USDC_MATIC, 
      WBTC_MATIC, 
      lptokenAddress, 
      strategyAddress,
      7 * 24 * 60 * 60,  // run strategy every 7 days
      100                // 1% fees
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

    // const strategyAddress = '0xd5de44DBA40dd79BCf99871F08f06618cDE23e06'
    // const lptokenAddress = '0x1Aa727Bd0966093801287d4E0993F583E099b91c'
    // const poolAddress = '0xd03571f6570d986e6c9209b8d4c97d74C49d6040'

    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      BTC_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WBTC_MATIC,
      60,   // target portfolio 60% WBTC / 40% DAI
      10,   // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )
    let strategy = await RebalancingStrategyV1.deployed();
    console.log("RebalancingStrategyV1 deployed - address: ", strategy.address)

    await deployer.deploy(PoolLPToken, "HashStrat LP - BTCUSD REB1 60/40", "BTCUSDR164", 18)
    let lptoken = await PoolLPToken.deployed();
    console.log("PoolLPToken deployed - address: ", lptoken.address)

    await deployer.deploy(PoolV2, 
      UNISWAP_V2_ROUTER_KOVAN, 
      BTC_USD_AGGREGATOR_KOVAN, 
      DAI_KOVAN,
      WBTC_KOVAN,
      lptoken.address, 
      strategy.address,
      7 * 24 * 60 * 60,  // run strategy every 7 days
      100                // 1% fees
    )
    let pool = await PoolV2.deployed();
    console.log("PoolV2 deployed - address: ", pool.address)

    await pool.setSlippageThereshold(9999)

    await lptoken.addMinter(pool.address)
    //await lptoken.renounceMinter()
    await strategy.setPool(pool.address)

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(pool.address)) )
  }
  

};