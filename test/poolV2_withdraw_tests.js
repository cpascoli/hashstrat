// const { assert } = require("console")
const { assert } = require("chai")
const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const PoolV2Test = artifacts.require("PoolV2Test")

const UniswapV2Router = artifacts.require("UniswapV2Router")
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
    let lptoken
    let strategy
    let precision

    beforeEach(async () => {
        usdcp = await USDCP.new(toUsdc('100000'))
        weth = await WETH.new(toWei('1000'))
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 6)

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        strategy = await RebalancingStrategyV1.new('0x0000000000000000000000000000000000000000', uniswap.address, usdcp.address, weth.address, 60, 2)
        pool = await PoolV2Test.new(uniswap.address, uniswap.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60, 100);
        
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


   it("When an account is is profit it should pay whitdrawal fees ", async () => {
   
        const feesPerc = await pool.feesPerc() / 10 ** await pool.feesPercDecimals()

        // peform deposit for account1
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })

        assert.equal(fromUsdc(await pool.lpTokensValue( toUsdc('20') )) , 20, "Invalid inital LP value")

        await uniswap.setPrice(4000)

        assert.equal(fromUsdc(await pool.lpTokensValue( toUsdc('20') )) , 32, "Invalid LP value")

        const fees = fromUsdc(await pool.feesForWithdraw( toUsdc('20'), account1)) // 0.075 LP
        const feesValue = fromUsdc(await pool.lpTokensValue( toUsdc(fees)) )       // 0.12 USDC

        const expectedFeeValue = (32 - 20) * feesPerc
        assert.equal(feesValue , expectedFeeValue, "Invalid fees")
    })


    it("When account withdraws some LP tokens and has no gains then no fees go to the pool", async () => {
   
        // peform deposit for account1
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue()
        assert.equal(portfolioValue, deposit , "Portfolio value should be the same as the initial deposit")

        const account1LP = await lptoken.balanceOf(account1)
        assert.equal(fromUsdc(account1LP), 60, "Invalid LP amount")

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
        await uniswap.setPrice(4000)

        // check withdraw fees when no gains
        const lpToWithdraw = toUsdc('20')
    
        // withdraw 20 LP tokens
        await pool.withdrawLP(lpToWithdraw, { from: account1 })

        const fees = await lptoken.balanceOf(pool.address)
        assert.equal( fromUsdc(await lptoken.balanceOf(account1)), 40, "Invalid LP tokens left")
        assert.equal( fromUsdc(await lptoken.balanceOf(pool.address)), 0.075, "Invalid LP tokens in the pool")

        const usdBalance = round(fromUsdc(await usdcp.balanceOf(account1)))
        const expectedUsdBalance = 1000 - 60 + 32 - 0.12
        assert.equal(usdBalance, expectedUsdBalance, "Invalid LP tokens left")
    })

})