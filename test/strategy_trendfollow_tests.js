const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc, increaseTime } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const PoolLPToken = artifacts.require("PoolLPToken")
const TrendFollowV1 = artifacts.require("TrendFollowV1");


contract("TrendFollowV1", accounts => {

    const defaultAccount = accounts[0]
    const account1 = accounts[1]
    const account2 = accounts[2]

    let pool

    let uniswap
    let usdcp
    let weth
    let priceFeed
    let lptoken
    let strategy

    beforeEach(async () => {
        usdcp = await USDCP.new(toUsdc('100000'))
        weth = await WETH.new(toWei('2000'))
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 6)

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        
        const feedDecimals = (await uniswap.decimals()).toString()
        const initialMeanValue  = (2000 * 10 ** feedDecimals).toString()

        strategy = await TrendFollowV1.new('0x0000000000000000000000000000000000000000', 
                                             priceFeed.address, usdcp.address, weth.address, 
                                             40, initialMeanValue, 0,  // movingAveragePeriod, initialMeanValue, minEvalInterval
                                             20, 0, 0, 100  // minAllocationPerc, targetPricePercUp, targetPricePercDown, tokensToSwapPerc
                                        )

        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60);
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
        await strategy.setPool(pool.address)

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, toUsdc('10000'))
        await weth.transfer(uniswap.address, toWei('1000'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toUsdc('1000'))
        await usdcp.transfer(account2, toUsdc('1000'))

        await uniswap.setPrice(2000)
    })


    it("If pool has 100%/0% allocation, it should rebalance to 80%/20%", async () => {
        // set eth price
        const price = 2000
        await uniswap.setPrice(price)

        // deposit 200 USDC
        let depositAmount = toUsdc('200')
        await usdcp.transfer(pool.address, depositAmount)

        const rebalanceAmount = fromUsdc(await strategy.rebalanceDepositTokensAmount())
        assert.equal(rebalanceAmount, "40", "Ivalid rebalance amount")

        await pool.invest()  // 200  USDC => 160 USDC + 0.02 ETH

        assert.equal( fromUsdc( await usdcp.balanceOf(pool.address)).toString(), '160', "Pool should have expected USDC balance")
        assert.equal( fromWei( await weth.balanceOf(pool.address)).toString(), '0.02', "Pool should have expected WETH balance")
        assert.equal( fromUsdc( await pool.investedTokenValue()).toString(), '40', "Pool should have expected WETH Value")
    })


    it("If pool has 0%/100% allocation, it should rebalance to 20%/80%", async () => {
   
        // set eth price
        const price = 2000
        await uniswap.setPrice(price)

        // deposit 0.5 WETH  (1000 USDC)
        let depositAmount = toWei('0.5')
        await weth.transfer(pool.address, depositAmount)

        const rebalanceAmount = fromWei(await strategy.rebalanceInvestTokensAmount())
        assert.equal(rebalanceAmount, "0.1", "Ivalid rebalance amount")

        await pool.invest()  // 0.5  WETH => 200 USDC + 0.4 ETH

        assert.equal( fromUsdc( await usdcp.balanceOf(pool.address)).toString(), '200', "Pool should have expected USDC balance")
        assert.equal( fromWei( await weth.balanceOf(pool.address)).toString(), '0.4', "Pool should have expected WETH balance")
        assert.equal( fromUsdc( await pool.investedTokenValue()).toString(), '800', "Pool should have expected WETH Value")
    })


    it("If price moves above the moving average, the strategy should BUY", async () => {
       
        // set eth price
        const price = 2000
        await uniswap.setPrice(price)

        // strategy params
        const targetPricePercUp = (await strategy.targetPricePercUp()) / 100
        const tokensToSwapPerc = (await strategy.tokensToSwapPerc()) / 100


        // allocate 500 USDC + 0.25 ETH to the bool (total value 1000 USDC)
        await usdcp.transfer(pool.address,  toUsdc('500'))
        await weth.transfer(pool.address,  toWei('0.25')) 
        
        assert.equal( await strategy.rebalanceDepositTokensAmount(), 0, "Ivalid rebalance amount")
        assert.equal( await strategy.rebalanceInvestTokensAmount(), 0, "Ivalid rebalance amount")
        
        const meanRev0 = await strategy.evaluateTrade()

        assert.equal(meanRev0[0].toString(), 0, "Strategy should do nothing")  // NO buy/sell
        assert.equal(meanRev0[1].toString(), 0, "Invalid token amount")

        await uniswap.setPrice(price + 500) // new price 2500, above the mean

        const meanRev1 = await strategy.evaluateTrade()
        const usdBalance = await usdcp.balanceOf(pool.address) 
        const usdToSell = usdBalance * tokensToSwapPerc

        assert.equal(meanRev1[0].toString(), 1, "Strategy should BUY")  // 
        assert.equal(meanRev1[1].toString(), usdToSell, "Invalid token amount to sell")

        await pool.invest()  // Sell 500 USDC (100%) - Portfolio: -500 USDC + 0.2 in ETH) => 0 USDC 0.45 ETH

        assert.equal( fromUsdc( await usdcp.balanceOf(pool.address)).toString(), 0, "Pool should have expected USDC balance")
        assert.equal( fromWei( await weth.balanceOf(pool.address)).toString(), 0.25 + 0.2, "Pool should have expected WETH balance")
        assert.equal( fromUsdc( await pool.investedTokenValue()).toString(), 1125, "Pool should have expected WETH Value")
    })



    it("If price moves below the moving average, the strategy should SELL", async () => {
       
        // set eth price
        const price = 2000
        await uniswap.setPrice(price)

        // strategy params
        const targetPricePercDown = (await strategy.targetPricePercDown()) / 100
        const tokensToSwapPerc = (await strategy.tokensToSwapPerc()) / 100

        // allocate 500 USDC + 0.25 ETH to the bool (total value 1000 USDC)
        await usdcp.transfer(pool.address,  toUsdc('500'))
        await weth.transfer(pool.address,  toWei('0.25')) 

        assert.equal( await strategy.rebalanceDepositTokensAmount(), 0, "Ivalid rebalance amount")
        assert.equal( await strategy.rebalanceInvestTokensAmount(), 0, "Ivalid rebalance amount")
        
        const meanRev0 = await strategy.evaluateTrade()
        assert.equal(meanRev0[0].toString(), 0, "Strategy should do nothing")  // NO buy/sell
        assert.equal(meanRev0[1].toString(), 0, "Invalid token amount")

        await uniswap.setPrice(price - 500)  // new price 1500  (portfolio down to $875 (500 USDC + $375 in ETH)

        const meanRev1 = await strategy.evaluateTrade()
        const ethBalance = await weth.balanceOf(pool.address) 
        const ethToSell = ethBalance * tokensToSwapPerc
        assert.equal(meanRev1[0].toString(), 2, "Strategy should SELL")  // 
        assert.equal(meanRev1[1].toString(), ethToSell, "Invalid amount of WETH tokens to SELL")

        await pool.invest()  // Sell 0.25 ETH (100%) - Portfolio: 500 USDC + 0.25 in ETH) => 875 USDC 0.0 ETH

        assert.equal( fromUsdc( await usdcp.balanceOf(pool.address)).toString(), 500 + 375, "Pool should have expected USDC balance")
        assert.equal( round(fromWei( await weth.balanceOf(pool.address)).toString(), 6), 0, "Pool should have expected WETH balance")
        assert.equal( round(fromUsdc( await pool.investedTokenValue()).toString() ), 0, "Pool should have expected WETH Value")
    })


    it("when strategy is called within a day the moving average is not udpated ", async () => {
  
        const movngAverageBefore = (await strategy.movingAverage()).toString()
        const lastEvalTimeBefore = (await strategy.lastEvalTime()).toString()
        await increaseTime(0.9 * 86400)

        await uniswap.setPrice(4000)
        await strategy.evaluate()

        const movngAverageAfter = (await strategy.movingAverage()).toString()
        const lastEvalTimeAfter = (await strategy.lastEvalTime()).toString()

        assert.isTrue(movngAverageAfter == movngAverageBefore, "same moving average")
        assert.isTrue(lastEvalTimeBefore == lastEvalTimeAfter, "same lastEvalTime value")
    })
    

    it("when strategy is called after a day the moving average is udpated ", async () => {
  
        const movngAverageBefore = (await strategy.movingAverage()).toString()
        const lastEvalTimeBefore = (await strategy.lastEvalTime()).toString()
        await increaseTime(1 * 86400)

        await uniswap.setPrice(4000)
        await strategy.evaluate()

        const movngAverageAfter = (await strategy.movingAverage()).toString()
        const lastEvalTimeAfter = (await strategy.lastEvalTime()).toString()

        assert.isTrue(movngAverageAfter > movngAverageBefore, "moving average updated")
        assert.isTrue(lastEvalTimeAfter - lastEvalTimeBefore >= 86400, "updated lastEvalTime value")
    })
    

})