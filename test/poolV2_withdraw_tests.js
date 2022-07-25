// const { assert } = require("console")
const { assert } = require("chai")
const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const PoolV2 = artifacts.require("PoolV2")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

contract("PoolV2 - withdraw", accounts => {

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
    let precision

    beforeEach(async () => {
        usdcp = await USDCP.new(toUsdc('100000'))
        weth = await WETH.new(toWei('1000'))
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 6)

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        strategy = await RebalancingStrategyV1.new('0x0000000000000000000000000000000000000000', priceFeed.address, usdcp.address, weth.address, 60, 2)
        pool = await PoolV2.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60, 100);
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
        await strategy.setPool(pool.address)

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, toUsdc('50000'))
        await weth.transfer(uniswap.address, toWei('500'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toUsdc('1000'))
        await usdcp.transfer(account2, toUsdc('1000'))

        precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits datafeed & portfolio % precision)

        await uniswap.setPrice(2000)
    })



    it("When account withdraws some LP tokens and has no gains then no fees go to the pool", async () => {
   
        const feesPerc = await pool.feesPerc() / 10 ** await pool.feesPercDecimals()

        // peform deposit for account1
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue()
        assert.equal(portfolioValue, deposit , "Portfolio value should be the same as the initial deposit")

        const account1LP = await lptoken.balanceOf(account1)
        assert.equal(fromUsdc(account1LP), 60, "Invalid LP amount")

        const lpTokensValue = fromUsdc(await pool.lpTokensValue(account1LP))
        assert.equal(lpTokensValue, 60, "Invalid LP token value")

        // check withdraw fees when no gains
        const lpToWithdraw = toUsdc('20')

        const feesWhenNoGains = await pool.feesForWithdraw(lpToWithdraw, account1)
        assert.equal(feesWhenNoGains, 0, "Invalid fees to withdraw")

    })


    it("When account withdraws some LP tokens and has gains then fees go to the pool", async () => {
   
        const feesPerc = await pool.feesPerc() / 10 ** await pool.feesPercDecimals()

        // peform deposit for account1
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })

        // price increase, no user has gains
        await uniswap.setPrice(3000)

        // check withdraw fees when no gains
        const lpToWithdraw = toUsdc('20')
        const lpToWithdrawValue = await pool.lpTokensValue(lpToWithdraw)

        assert.equal(fromUsdc(lpToWithdrawValue), 26, "Invalid lp token value")

        const expectedFees = lpToWithdraw * feesPerc
        const feesForWithdraw = await pool.feesForWithdraw(lpToWithdraw, account1)
        assert.equal(feesForWithdraw, expectedFees, "Invalid fees")

        // withdraw 20 LP tokens
        await pool.withdrawLP(lpToWithdraw, { from: account1 })

        const fees = await lptoken.balanceOf(pool.address)
        assert.equal( fromUsdc(await lptoken.balanceOf(account1)), 40, "Invalid LP tokens left")
        assert.equal( fromUsdc(fees), 0.2, "Invalid LP tokens in the pool")

        const feeValue = await pool.lpTokensValue(fees)
        assert.equal(fromUsdc(feeValue), 0.26)

        const expectedUsdcBalance = 1000 - 60 + 26 - 0.26
        assert.equal( fromUsdc(await usdcp.balanceOf(account1)), expectedUsdcBalance , "Invalid LP tokens left")
    })


    // it("withdraw after price increase", async () => {

    //     await uniswap.setPrice(2000) // ETH is at $2000
    //     const precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits precision)

    //     let balanceBefore = await usdcp.balanceOf(pool.address)
    //     assert.equal(balanceBefore, 0, "Account should have no balance")

    //     let deposit1 = toUsdc('60')
    //     let deposit2 = toUsdc('100')

    //     // peform deposit for account1
    //     await usdcp.approve(pool.address, deposit1, { from: account1 })
    //     await pool.deposit(deposit1, { from: account1 })

    //     const portfolioValue = await pool.totalPortfolioValue()
    //     assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

    //     // peform deposit for account2
    //     await usdcp.approve(pool.address, deposit2, { from: account2 })
    //     await pool.deposit(deposit2, { from: account2 })

    //     assert.equal(fromUsdc(( await usdcp.balanceOf(account1))), 940, "Invalid account1 balance before")
    //     assert.equal(fromUsdc(( await usdcp.balanceOf(account2))), 900, "Invalid account2 balance before")
    //     assert.equal(fromUsdc((await pool.portfolioValue(account1))), 60 , "Invalid account1 portfolio value")
    //     assert.equal(fromUsdc((await pool.portfolioValue(account2))), 100 , "Invalid account2 portfolio value")
    //     assert.equal(fromUsdc((await pool.totalPortfolioValue())), 160, "Invalid total portfolio value before")
    //     assert.equal((await pool.portfolioPercentage(account1)) * 100 / precision, 37.5, "Invalid account1 portfolio % before")
    //     assert.equal((await pool.portfolioPercentage(account2)) * 100 / precision, 62.5, "Invalid account2 portfolio % before")

    //     const price1 = await priceFeed.getLatestPrice()
    //     await pool.invest()  // invest 96 USDC into eth

    //     assert.equal(fromUsdc((await pool.portfolioValue(account1))), 60, "Invalid portfolio value for account1 after withdrawal")
    //     assert.equal(fromUsdc((await pool.portfolioValue(account2))), 100, "Invalid portfolio value for account2 after withdrawal")
    //     assert.equal(fromUsdc((await pool.totalPortfolioValue())), 160, "Invalid total portfolio value for account2 after withdrawal")
        
    //     await uniswap.setPrice(3000) // ETH goes up to $3000

    //     const targetInvestPerc = await strategy.targetInvestPerc.call() / 100
    //     const price2 = await priceFeed.getLatestPrice()
    //     const portfolioVal = 160 * (1 - targetInvestPerc) + ((160 * targetInvestPerc) / price1 * price2)
    //     const account1Val = portfolioVal * 60 / 160
    //     const account2Val = portfolioVal * 100 / 160

    //     assert.equal(fromUsdc((await pool.portfolioValue(account1))), account1Val, "Invalid portfolio value for account1")
    //     assert.equal(fromUsdc((await pool.portfolioValue(account2))), account2Val, "Invalid portfolio value for account2")
    //     assert.equal(fromUsdc((await pool.totalPortfolioValue())), portfolioVal, "Invalid total portfolio value for account2 after withdrawal")

    //     // account1 withdraws all 
    //     const value1a = await pool.portfolioValue(account1)
    //     await pool.withdraw(value1a, { from: account1 })

    //     assert.equal(fromUsdc((await pool.portfolioValue(account1))), 0, "Invalid portfolio value for account1 after withdrawal")
    //     assert.equal(fromUsdc((await pool.portfolioValue(account2))), account2Val, "Invalid portfolio value for account2 after withdrawal")
    //     assert.equal(fromUsdc((await pool.totalPortfolioValue())), (portfolioVal - account1Val), "Invalid total portfolio value for account2 after withdrawal")

    //     // account2 withdraws all 
    //     const value2a = await pool.portfolioValue(account2) 
    //     await pool.withdraw(value2a, { from: account2 })

    //     assert.equal(round(fromUsdc((await pool.portfolioValue(account1))), 10), 0, "Invalid portfolio value for account1 after withdrawal")
    //     assert.equal(round(fromUsdc((await pool.portfolioValue(account2))), 10), 0, "Invalid portfolio value for account2 after withdrawal")
    //     assert.equal(round(fromUsdc((await pool.totalPortfolioValue())), 10), 0, "Invalid total portfolio value for account2 after withdrawal")
    // })

})