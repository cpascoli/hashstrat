
const Pool = artifacts.require("Pool");
const MeanReversionV1 = artifacts.require("MeanReversionV1");


// Kovan
const DAI_KOVAN = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'
const WETH_KOVAN = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const WETH_MATIC = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'

// Chainlink  ETH/USD price feeds
const ETH_USD_AGGREGATOR_KOVAN = '0x9326BFA02ADD2366b30bacB125260Af641031331'
const ETH_USD_AGGREGATOR_MATIC = '0xF9680D99D6C9589e2a93a78A04A279e509205945'


var publicChains = ['matic'];

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying Strategy ETH/USD MeanReversionV1 to ", network)

  // if(publicChains.includes(network)) {
  //   return; //We don't want a Migrations contract on the mainnet, don't waste gas.
  // }


  if (network.startsWith('develop')) {
   
    const UniswapV2Router = artifacts.require("UniswapV2Router");

    const strategy = await deployer.deploy(
      TrendFollowV1,
      '0x0000000000000000000000000000000000000000', // pool address not known yet
      UniswapV2Router.address, // pricefeed
      usdcp.address, 
      wbtc.address,
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

    const poolAddress = '0x3c9fe4F73173f7869Db4FCF6bAc17896B7E15286'

    await deployer.deploy(
      MeanReversionV1,
      poolAddress,
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
  }
  
  
  if (network.startsWith('kovan')) {

    const poolAddress = '0x2f0c77df924F1cbEA201DF95b6ef4EfE4d21B36B'

    await deployer.deploy(
      MeanReversionV1,
      poolAddress, // pool address not known yet
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

    let strategy = await MeanReversionV1.deployed();
    let strategyAddress = strategy.address
    await strategy.setPool(poolAddress)

    console.log("MeanReversionV1 deployed - address: ", strategyAddress)
  }
  

};