
const PoolV2 = artifacts.require("PoolV2");
const PoolLPToken = artifacts.require("PoolLPToken");
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");


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

  console.log("deploying Pool ETH/USD REBAL 60/40 to ", network)



  if (network.startsWith('develop')) {
   
    const USDCP = artifacts.require("USDCP");
    const WETH = artifacts.require("WETH");
    const UniswapV2Router = artifacts.require("UniswapV2Router");

    const usdcp = await deployer.deploy(USDCP, web3.utils.toWei('100000', 'mwei'));
    const weth = await deployer.deploy(WETH, web3.utils.toWei('1000', 'ether'));
    const uniswap = await deployer.deploy(UniswapV2Router, usdcp.address, weth.address);
    const lptoken = await deployer.deploy(PoolLPToken, "HashStrat LP (ETHUSD 60/40)", "ETHUSD6040", 6)

    const strategy = await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      uniswap.address,  // pricefeed
      usdcp.address, 
      weth.address,
      60,   // target portfolio 60% WETH / 40% USDC
      2,    // 15% seems a good rebalancing threshold but we use 2% for kovan tests
    )

    const pool = await deployer.deploy(PoolV2, 
      uniswap.address, 
      uniswap.address, // pricefeed
      usdcp.address, 
      weth.address, 
      lptoken.address, 
      strategy.address,
      7 * 24 * 60 * 60, // run strategy once a day
      100               // 1% fee
    )

    await lptoken.addMinter(pool.address)
    await lptoken.renounceMinter()

    await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
    await strategy.setPool(pool.address)

    console.log("PoolV2 address:", pool.address, "Pool is Minter: ", (await lptoken.isMinter(pool.address)) )
  }
  
  
  if (network.startsWith('matic')) {

    // const strategyAddress = '0xf1D820d6cd6420ED9332E5ec616022F8136722d4'
    // const lptokenAddress = '0x23De455b52537c442c00F8eC5c11fC64d4e9811E'
    // const poolAddress = '0xeA2addD56cef3757ed9e473e5Bb39E5aF00531F0'

    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_MATIC,
      USDC_MATIC, 
      WETH_MATIC,
      60,   // target portfolio 60% WETH / 40% USDC
      10,   // 10% seems a good rebalancing band that requires price to double or halve to rebalance
    )

    let strategy = await RebalancingStrategyV1.deployed();
    console.log("RebalancingStrategyV1 deployed - address: ", strategy.address)
    let strategyAddress = strategy.address

    await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSD REB1 60/40", "ETHUSDR164", 6) 
    let lptoken = await PoolLPToken.deployed();
    console.log("PoolLPToken deployed - address: ", lptoken.address)
    let lptokenAddress = lptoken.address

    await deployer.deploy(PoolV2, 
      QUICKSWAP_V2_ROUTER_MATIC, 
      ETH_USD_AGGREGATOR_MATIC, 
      USDC_MATIC, 
      WETH_MATIC, 
      lptokenAddress, 
      strategyAddress,
      7 * 24 * 60 * 60, // run strategy every 7 days
      100               // 1% fee
    )
    let pool = await PoolV2.deployed();
    console.log("PoolV2 deployed - address: ", pool.address)

    await strategy.setPool(pool.address)
    await lptoken.addMinter(pool.address)
    //await lptoken.renounceMinter()

    console.log("PoolV2 is Minter: ", (await lptoken.isMinter(pool.address)) )
  }
  
  
  if (network.startsWith('kovan')) {

    // const strategyAddress = '0x192D5c006A7c5f6e8e522800c7f5458f97f3C445'
    // const lptokenAddress = '0xe5d3e40C4151F78FBa77934A6dba1e472ACcDd56'
    // const poolAddress = '0x506EF94d660d86B23e7f33378c445B970AdD1055'

    await deployer.deploy(
      RebalancingStrategyV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      ETH_USD_AGGREGATOR_KOVAN,
      DAI_KOVAN, 
      WETH_KOVAN,
      60,   // target portfolio 60% WETH / 40% DAI
      10,   // 10% seems a good rebalancing threshold but we use 2% for kovan tests
    )
    let strategy = await RebalancingStrategyV1.deployed();
    console.log("RebalancingStrategyV1 deployed - address: ", strategy.address)

    await deployer.deploy(PoolLPToken, "HashStrat LP - ETHUSD REB1 60/40", "ETHUSDR164", 18)
    let lptoken = await PoolLPToken.deployed();
    console.log("PoolLPToken deployed - address: ", lptoken.address)

    await deployer.deploy(PoolV2, 
      UNISWAP_V2_ROUTER_KOVAN, 
      ETH_USD_AGGREGATOR_KOVAN, 
      DAI_KOVAN,
      WETH_KOVAN,
      lptoken.address, 
      strategy.address,
      7 * 24 * 60 * 60,  // run strategy every 7 days
      100               // 1% fee
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