// const { assert } = require("console")
const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

contract("Pool", accounts => {

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

    // this should match Pool::portFolioPercentagePrecision
    const precision = 10**18

    beforeEach(async () => {
        usdcp = await USDCP.new(toUsdc('100000'))
        weth = await WETH.new(toWei('1000'))
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 18)

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        strategy = await RebalancingStrategyV1.new(usdcp.address, weth.address, 60, 20)
        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60);
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPoolAddress(pool.address) //FIXME this is probably unnecessary

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, toUsdc('10000'))
        await weth.transfer(uniswap.address, toWei('1000'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toUsdc('1000'))
        await usdcp.transfer(account2, toUsdc('1000'))
    })


    it("withdraw of inital deposit", async () => {

        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let deposit1 = toUsdc('60')
        let deposit2 = toUsdc('100')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue()
        assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        assert.equal(fromUsdc(( await usdcp.balanceOf(account1))), 940, "Invalid account1 balance before")
        assert.equal(fromUsdc(( await usdcp.balanceOf(account2))), 900, "Invalid account2 balance before")
        assert.equal(fromUsdc((await pool.portfolioValue(account1))), 60 , "Invalid account1 portfolio value")
        assert.equal(fromUsdc((await pool.portfolioValue(account2))), 100 , "Invalid account2 portfolio value")
        assert.equal(fromUsdc((await pool.totalPortfolioValue())), 160, "Invalid total portfolio value before")
        assert.equal((await pool.portfolioPercentage(account1)) * 100 / precision, 37.5, "Invalid account1 portfolio % before")
        assert.equal((await pool.portfolioPercentage(account2)) * 100 / precision, 62.5, "Invalid account2 portfolio % before")
        
        // Account1 withdraws 20 usd
        let withraw1 = toUsdc('20')
        await pool.withdraw(withraw1, { from: account1 })

        assert.equal(fromUsdc((await usdcp.balanceOf(account1))), 960, "Invalid account1 balance after")
        assert.equal(fromUsdc((await usdcp.balanceOf(account2))), 900, "Invalid account2 balance after")
        assert.equal(round(fromUsdc((await pool.portfolioValue(account1)))), 40 , "Invalid account1 portfolio value after")
        assert.equal(round(fromUsdc((await pool.portfolioValue(account2)))), 100 , "Invalid account2 portfolio value after")
        assert.equal(fromUsdc((await pool.totalPortfolioValue())), 140, "Invalid total portfolio value")
        assert.equal(round((await pool.portfolioPercentage(account1)) * 100 / precision), 28.57, "Invalid account1 portfolio % before")
        assert.equal(round((await pool.portfolioPercentage(account2)) * 100 / precision), 71.43, "Invalid account2 portfolio % before")

    })


    it("withdraw after price increase", async () => {

        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let deposit1 = toUsdc('60')
        let deposit2 = toUsdc('100')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue()
        console.log("portfolioValue >>", fromUsdc(portfolioValue))  // 60000000
        console.log("account1 balance >>", (await usdcp.balanceOf(account1)).toString(), ">> ", fromUsdc(await usdcp.balanceOf(account1)) )  // 60000000

        assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        assert.equal(fromUsdc(( await usdcp.balanceOf(account1))), 940, "Invalid account1 balance before")
        assert.equal(fromUsdc(( await usdcp.balanceOf(account2))), 900, "Invalid account2 balance before")
        assert.equal(fromUsdc((await pool.portfolioValue(account1))), 60 , "Invalid account1 portfolio value")
        assert.equal(fromUsdc((await pool.portfolioValue(account2))), 100 , "Invalid account2 portfolio value")
        assert.equal(fromUsdc((await pool.totalPortfolioValue())), 160, "Invalid total portfolio value before")
        assert.equal((await pool.portfolioPercentage(account1)) * 100 / precision, 37.5, "Invalid account1 portfolio % before")
        assert.equal((await pool.portfolioPercentage(account2)) * 100 / precision, 62.5, "Invalid account2 portfolio % before")
  
        await uniswap.setPrice(2000) // ETH is at $2000

        const price1 = await priceFeed.getLatestPrice()
        await pool.invest()  // invest 96 USDC into eth

        console.log("usdc balance1", (await usdcp.balanceOf(pool.address)).toString(), fromUsdc(await usdcp.balanceOf(pool.address)))
        console.log("weth balance1", (await weth.balanceOf(pool.address)).toString(), fromWei(await weth.balanceOf(pool.address)))
        const totalPortfolioValue1 = await pool.totalPortfolioValue();
        console.log("totalPortfolioValue1:",  fromUsdc(totalPortfolioValue1), totalPortfolioValue1.toString())  //  96000000000064000000

        assert.equal(fromUsdc((await pool.portfolioValue(account1))), 60, "Invalid portfolio value for account1 after withdrawal")
        assert.equal(fromUsdc((await pool.portfolioValue(account2))), 100, "Invalid portfolio value for account2 after withdrawal")
        assert.equal(fromUsdc((await pool.totalPortfolioValue())), 160, "Invalid total portfolio value for account2 after withdrawal")
        
        await uniswap.setPrice(3000) // ETH goes up to $3000

        console.log("usdc balance2", (await usdcp.balanceOf(pool.address)).toString(), fromUsdc(await usdcp.balanceOf(pool.address)))
        console.log("weth balance2", (await weth.balanceOf(pool.address)).toString(), fromWei(await weth.balanceOf(pool.address)))
        const totalPortfolioValue2 = await pool.totalPortfolioValue();
        console.log("totalPortfolioValue2:",  fromUsdc(totalPortfolioValue2), totalPortfolioValue2.toString())  //  96000000000064000000

        const targetInvestPerc = await strategy.targetInvestPerc.call() / 100
        const price2 = await priceFeed.getLatestPrice()
        const portfolioVal = 160 * (1 - targetInvestPerc) + ((160 * targetInvestPerc) / price1 * price2)
        const account1Val = portfolioVal * 60 / 160
        const account2Val = portfolioVal * 100 / 160

        assert.equal(fromUsdc((await pool.portfolioValue(account1))), account1Val, "Invalid portfolio value for account1")
        assert.equal(fromUsdc((await pool.portfolioValue(account2))), account2Val, "Invalid portfolio value for account2")
        assert.equal(fromUsdc((await pool.totalPortfolioValue())), portfolioVal, "Invalid total portfolio value for account2 after withdrawal")

        // account1 withdraws all 
        const value1a = await pool.portfolioValue(account1)
        await pool.withdraw(value1a, { from: account1 })

        assert.equal(fromUsdc((await pool.portfolioValue(account1))), 0, "Invalid portfolio value for account1 after withdrawal")
        assert.equal(fromUsdc((await pool.portfolioValue(account2))), account2Val, "Invalid portfolio value for account2 after withdrawal")
        assert.equal(fromUsdc((await pool.totalPortfolioValue())), (portfolioVal - account1Val), "Invalid total portfolio value for account2 after withdrawal")

        // account2 withdraws all 
        const value2a = await pool.portfolioValue(account2) 
        await pool.withdraw(value2a, { from: account2 })

        assert.equal(round(fromUsdc((await pool.portfolioValue(account1))), 10), 0, "Invalid portfolio value for account1 after withdrawal")
        assert.equal(round(fromUsdc((await pool.portfolioValue(account2))), 10), 0, "Invalid portfolio value for account2 after withdrawal")
        assert.equal(round(fromUsdc((await pool.totalPortfolioValue())), 10), 0, "Invalid total portfolio value for account2 after withdrawal")
    })

})