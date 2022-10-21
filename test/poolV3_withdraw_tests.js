// const { assert } = require("console")
const { assert } = require("chai")
const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const PoolV3Test = artifacts.require("PoolV3Test")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

contract("PoolV3 - withdraw", accounts => {

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
        pool = await PoolV3Test.new(uniswap.address, uniswap.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60, 100);
        
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

        assert.equal((await pool.gainsPerc(account1) / 10000 ).toString(), 0.6, "Invalid gains %")
        assert.equal(fromUsdc(await pool.lpTokensValue( toUsdc('20') )) , 32, "Invalid LP value")

        const fees = fromUsdc(await pool.feesForWithdraw( toUsdc('20'), account1))
        assert.equal(fees, 0.12, "Invalid fees")

        const feesValue = fromUsdc(await pool.lpTokensValue( toUsdc(fees)) )  // 0.192 USDC
        const expectedFeeValue = 0.6 * 32 * feesPerc  // 0.192 USDC (profit %  * value withdrawn * fees perc)
        assert.equal(feesValue , expectedFeeValue, "Invalid fee value")
    })


    it("When account withdraws some LP tokens and has no gains then no fees go to the pool", async () => {
   
        // peform deposit for account1
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })

        const portfolioValue = await pool.totalValue()
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

        // withdraw 20 LP tokens
        await pool.withdrawLP(toUsdc('20'), { from: account1 })

        const fees = await lptoken.balanceOf(pool.address)
        assert.equal( fromUsdc(await lptoken.balanceOf(account1)), 40, "Invalid LP tokens left")
        assert.equal( fromUsdc(await lptoken.balanceOf(pool.address)), 0.12, "Invalid LP tokens in the pool")

        const usdBalance = round(fromUsdc(await usdcp.balanceOf(account1)), 1)
        const expectedUsdBalance = round(1000 - 60 + 32 - 0.192, 1)
        assert.equal(usdBalance, expectedUsdBalance, "Invalid LP tokens left")
    })



    it("When LP tokens are withdrawn by a different account, they pay the full fees", async () => {
   
        const feesPerc = await pool.feesPerc() / 10 ** await pool.feesPercDecimals()

        // account1 deposit 60 usdc and gets 60 LPs
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })
        assert.equal(await lptoken.balanceOf(account1), toUsdc('60'), "Invalid LP tokens for deposit")

        // price increase, account1's LPs are with more
        await uniswap.setPrice(4000)

        // account1 transfer 60 LP to account2
        await lptoken.transfer(account2, await lptoken.balanceOf(account1), { from: account1 })

        // verify withdraw fees for account2
        const expectedFees = toUsdc('60') * 0.01 /// 1% fees over the full LP balance
        assert.equal( await pool.feesForWithdraw(await lptoken.balanceOf(account2), account2) , expectedFees, "invalid fees to withdraw")

        // account2 withdraw 60 LP tokens
        await pool.withdrawLP(await lptoken.balanceOf(account2), { from: account2 })

        // verify fees in the pool
        assert.equal(await lptoken.balanceOf(pool.address), expectedFees, "invalid fees in pool")
    })


  
    it("When the owner collects all fees, no fees are left in the pool", async () => {
   
        // peform deposit for account1
        let deposit = toUsdc('60')
        await usdcp.approve(pool.address, deposit, { from: account1 })
        await pool.deposit(deposit, { from: account1 })

        // price increase, no user has gains
        await uniswap.setPrice(4000)

        // withdraw 20 LP tokens, 0.12 LP are left in the pool as fee
        await pool.withdrawLP(toUsdc('20'), { from: account1 })

        // owner collect all fees
        await pool.collectFees(0, { from: defaultAccount })

        assert.equal( await lptoken.balanceOf(pool.address), 0, "Invalid LP tokens left in the pool")
    })


})