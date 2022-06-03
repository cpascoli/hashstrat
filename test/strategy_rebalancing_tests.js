const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");


contract("RebalancingStrategyV1", accounts => {

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
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 18)

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        strategy = await RebalancingStrategyV1.new('0x0000000000000000000000000000000000000000', priceFeed.address, usdcp.address, weth.address, 60, 20)
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
    })


    it("If pool has 100%/0% allocation, it should rebalance to 60%/40%", async () => {
   
        // deposit 1 USDCP 
        let depositAmount = toUsdc('200')
        await usdcp.approve(pool.address, depositAmount, { from: account1 })
        await pool.deposit(depositAmount, { from: account1 })

        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, depositAmount , "Pool should have expected token balance")

        uniswap.setPrice(2000)
        await pool.invest()  // 200  USdC => 80 USDC + 0.06 ETH

        let usdcAfter = await usdcp.balanceOf(pool.address)
        let wethAfter = await weth.balanceOf(pool.address)
        let wethValue = await pool.investedTokenValue()
        
        let expectedUsdcAfter = depositAmount * 0.4
        let expectedWethValueAfter = depositAmount * 0.6
        let expectedWethAfter = toWei('0.06')

        assert.equal(usdcAfter, expectedUsdcAfter, "Pool should have expected USDC balance")
        assert.equal(wethAfter, expectedWethAfter, "Pool should have expected WETH balance")
        assert.equal(wethValue, expectedWethValueAfter, "Pool should have expected WETH Value")
    })


    it("If pool is at 60%/40% allocation, it should stay at 60%/40%", async () => {
   
        await usdcp.transfer(pool.address, toUsdc('80'), { from: defaultAccount })
        await weth.transfer(pool.address, toWei('0.06'), { from: defaultAccount })

        await uniswap.setPrice(2000)  // 80 USDC + 0.06 ETH (120 USDC) = 200 USDC 
        await pool.invest()  

        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        let balanceWethAfter = await weth.balanceOf(pool.address)
        const totalPortfolioValueAfter = await pool.totalPortfolioValue() 

        assert.equal(balanceUsdcAfter.toString(), toUsdc('80'), "Invalid usdc value")
        assert.equal(balanceWethAfter.toString(), toWei('0.06'), "Invalid weth value")
        assert.equal(totalPortfolioValueAfter, toUsdc('200'), "Invalid portfolio value")
    })


    it("If pool is at 80%/20% allocation, it should rebalance to 60%/40%", async () => {
   
        await usdcp.transfer(pool.address, toUsdc('80'), { from: defaultAccount })
        await weth.transfer(pool.address, toWei('0.01'), { from: defaultAccount })

        await uniswap.setPrice(2000)  // 80 USDC + 0.01 ETH (20 USDC) = 100 USDC 
        await pool.invest()  

        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        let balanceWethAfter = await weth.balanceOf(pool.address)
        const totalPortfolioValueAfter = await pool.totalPortfolioValue() 

        assert.equal(balanceUsdcAfter.toString(), toUsdc('40'), "Invalid usdc value")
        assert.equal(balanceWethAfter.toString(), toWei('0.03'), "Invalid weth value")
        assert.equal(totalPortfolioValueAfter, toUsdc('100'), "Invalid portfolio value")
    })


    it("If pool is at 20%/80% allocation, it should rebalance to 60%/40%", async () => {
   
        await usdcp.transfer(pool.address, toUsdc('20'), { from: defaultAccount })
        await weth.transfer(pool.address, toWei('0.04'), { from: defaultAccount })

        await strategy.setRebalancingThreshold(19) // set rebalance threshold below current pool balance
        await uniswap.setPrice(2000)  // 20 USDC + 0.04 ETH (80 USDC) = 100 USDC 
        await pool.invest()
      
        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        let balanceWethAfter = await weth.balanceOf(pool.address)
        const totalPortfolioValueAfter = await pool.totalPortfolioValue() 

        assert.equal(balanceUsdcAfter.toString(), toUsdc('40'), "Invalid usdc value")
        assert.equal(balanceWethAfter.toString(), toWei('0.03'), "Invalid weth value")
        assert.equal(totalPortfolioValueAfter, toUsdc('100'), "Invalid portfolio value")
    })


    it("If prioce moves within the rebalancing threshold, the token allocation should not change", async () => {
        
        await usdcp.transfer(pool.address, toUsdc('80'), { from: defaultAccount })
        await weth.transfer(pool.address, toWei('0.06'), { from: defaultAccount })

        await strategy.setRebalancingThreshold(10) 
        await uniswap.setPrice(2000)
        await pool.invest()  

        const totalPortfolioValue0 = await pool.totalPortfolioValue() 
        assert.equal((await pool.depositTokenValue()) / totalPortfolioValue0, 0.4, "Invalid usdc %")
        assert.equal((await pool.investedTokenValue()) / totalPortfolioValue0, 0.6, "Invalid usdc %")

        const usdc1 = await usdcp.balanceOf(pool.address)
        const weth1 = await weth.balanceOf(pool.address)
        assert.equal(usdc1, toUsdc('80'), "Invalid usdc %")
        assert.equal(weth1, toWei('0.06'), "Invalid usdc %")

        await uniswap.setPrice(2000 * 1.1) 
        await pool.invest() 

        const usdc2 = await usdcp.balanceOf(pool.address)
        const weth2 = await weth.balanceOf(pool.address)
        assert.equal(usdc2, toUsdc('80'), "Invalid usdc %")
        assert.equal(weth2, toWei('0.06'), "Invalid usdc %")

        await uniswap.setPrice(2000 * 0.8)
        await pool.invest() 

        const usdc3 = await usdcp.balanceOf(pool.address)
        const weth3 = await weth.balanceOf(pool.address)
        assert.equal(usdc3, toUsdc('80'), "Invalid usdc %")
        assert.equal(weth3, toWei('0.06'), "Invalid usdc %")
    })


    it("When price moves outside the rebalancing threshold, the pool should rebalance", async () => {
        
        await usdcp.transfer(pool.address, toUsdc('80'), { from: defaultAccount })
        await weth.transfer(pool.address, toWei('0.06'), { from: defaultAccount })

        const balanceUsdc = await usdcp.balanceOf(pool.address)
        const balanceWeth = await weth.balanceOf(pool.address)

        await strategy.setRebalancingThreshold(2) // 2%
        await uniswap.setPrice(2000)
        await pool.invest()  

        const totalPortfolioValue0 = await pool.totalPortfolioValue() 
        assert.equal(totalPortfolioValue0, toUsdc('200'), "Invalid portfolio value")
        assert.equal((await pool.depositTokenValue()) / totalPortfolioValue0, 0.4, "Invalid usdc %")
        assert.equal((await pool.investedTokenValue()) / totalPortfolioValue0, 0.6, "Invalid usdc %")

        const usdc1 = await usdcp.balanceOf(pool.address)
        const weth1 = await weth.balanceOf(pool.address)
        assert.equal(usdc1, toUsdc('80'), "Invalid usdc %")
        assert.equal(weth1, toWei('0.06'), "Invalid usdc %")

        await uniswap.setPrice(2000 * 1.02) 
        await pool.invest()

        const usdc2 = await usdcp.balanceOf(pool.address)
        const weth2 = await weth.balanceOf(pool.address)
        assert.equal(usdc2, toUsdc('80'), "Invalid usdc %")
        assert.equal(weth2, toWei('0.06'), "Invalid usdc %")

        await uniswap.setPrice(2000 * 0.95) // price below 2% target => should rebalance 
        await pool.invest() 

        const usdc3 = await usdcp.balanceOf(pool.address)
        const weth3 = await weth.balanceOf(pool.address)
        assert.equal(usdc3.toString(), toUsdc('77.6'), "Invalid usdc amount")
        assert.equal(weth3.toString(), toWei('0.061263157894736842'), "Invalid weth amount")

    })

})