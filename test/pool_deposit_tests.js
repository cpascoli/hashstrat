const { assert } = require("chai")
const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

contract("Pool - deposit", accounts => {

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

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 6)
        strategy = await RebalancingStrategyV1.new('0x0000000000000000000000000000000000000000', priceFeed.address, usdcp.address, weth.address, 60, 2)
        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60);
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
        await strategy.setPool(pool.address)

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, toUsdc('10000'))
        await weth.transfer(uniswap.address, toWei('500'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toUsdc('1000'))
        await usdcp.transfer(account2, toUsdc('1000'))

        precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits datafeed & portfolio % precision)
    })


    it("A first deposit into the Pool should allocate 40%/60% of USDC and WETH to the pool", async () => {

        let balanceUsdcBefore = await usdcp.balanceOf(pool.address)
        let balanceEthBefore = await weth.balanceOf(pool.address)
        assert.equal(balanceUsdcBefore, 0, "Account should have no USDC balance")
        assert.equal(balanceEthBefore, 0, "Account should have no ETH balance")

        await uniswap.setPrice(2000)

        // deposit 1 USDCP 
        let depositAmount = toUsdc('1000')
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount, { from: defaultAccount })

        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        let balanceWethAfter = await weth.balanceOf(pool.address)

        let expectedUsdc = fromUsdc(depositAmount) * 0.4
        let expectedEth = fromUsdc(depositAmount) * 0.6 / 2000

        assert.equal(fromUsdc(balanceUsdcAfter), expectedUsdc, "Pool should have expected USDC balance")
        assert.equal(fromWei(balanceWethAfter), expectedEth, "Pool should have expected WETH balance")
    })


    it("New deposits into the Pool preserve the current pool allocations USDC/WETH perc allocation", async () => {

        await uniswap.setPrice(2000)

        let deposit1 = toUsdc('100')
        let deposit2 = toUsdc('200')
        let deposit3 = toUsdc('123.45')

        // first deposit by account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        let balanceUsdcAfter1 = await usdcp.balanceOf(pool.address)
        let balanceWethAfter1 = await weth.balanceOf(pool.address)

        let expectedUsdc1 = 100 * 0.4
        let expectedEth1 = 100 * 0.6 / 2000
        assert.equal(fromUsdc(balanceUsdcAfter1), expectedUsdc1, "Pool should have expected USDC balance")
        assert.equal(fromWei(balanceWethAfter1), expectedEth1, "Pool should have expected WETH balance")
        assert.equal(fromWei(await pool.investTokenPercentage(), 8), 0.6, "Pool should have expected initial WETH allocation")

        // second deposit by account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        let balanceUsdcAfter2 = await usdcp.balanceOf(pool.address)
        let balanceWethAfter2 = await weth.balanceOf(pool.address)

        let expectedUsdc2 = 300 * 0.4
        let expectedEth2 = 300 * 0.6 / 2000
        assert.equal(fromUsdc(balanceUsdcAfter2), expectedUsdc2, "Pool should have expected USDC balance")
        assert.equal(fromWei(balanceWethAfter2), expectedEth2, "Pool should have expected WETH balance")
        assert.equal(fromWei(await pool.investTokenPercentage(), 8), 0.6, "Pool should have expected allocation")

        // price increase
        const newEthhPrice = 3000
        await uniswap.setPrice(newEthhPrice)

        const expectedPoolAllocation = round(expectedEth2 * newEthhPrice / ( expectedEth2 * newEthhPrice + expectedUsdc2), 8) // 0.69230769
        assert.equal(fromWei(await pool.investTokenPercentage(), 8), expectedPoolAllocation), "Invalid pool allocation after price increase"

        // new deposit
        await usdcp.approve(pool.address, deposit3, { from: account2 })
        await pool.deposit(deposit3, { from: account2 })

        // same allocation
        assert.equal(fromWei(await pool.investTokenPercentage(), 8), expectedPoolAllocation), "Invalid pool allocation after new deposit"
    })


    it("A first deposit into the Pool allocate the inital amount of LP tokens to the user", async () => {

        // deposit 100 USDCP 
        let depositAmount =  toUsdc('100')
        await usdcp.approve(pool.address, depositAmount, { from: defaultAccount })
        await pool.deposit(depositAmount, { from: defaultAccount })

        const portfolioValue = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue, depositAmount , "Portfolio value should be the same as initial deposit")

        // expect 100 initial portfolio allocation
        const lptokenbalance = await lptoken.balanceOf(defaultAccount)
        assert.equal(fromUsdc(lptokenbalance), 100 , "Invalid first portfolio allocation")

        // expect 100 total portfolio allocation 
        const totalPortfolioLP = await lptoken.totalSupply()
        assert.equal(fromUsdc(totalPortfolioLP), 100 , "Invalid total portfolio allocation")

        // expect 100% portfolio allocation 
        const precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits precision)
        const portfolioPercentage = await pool.portfolioPercentage(defaultAccount) * 100 / precision
        assert.equal(portfolioPercentage, 100 , "Invalid portfolio percentage")
    })


    it("allocates additional LP tokens for second deposit", async () => {
        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let firstDeposit = toUsdc('100')
        let secondDeposit = toUsdc('200')

        // allow the ppol to spend both deposits
        await usdcp.approve(pool.address, firstDeposit + secondDeposit)

        // peform first deposit
        await pool.deposit(firstDeposit, { from: defaultAccount })

        const portfolioValue1 = await pool.totalPortfolioValue() 
        assert.equal(fromUsdc(portfolioValue1), 100, "Portfolio value should be the same as the initial deposit")

        // expect 100 initial portfolio allocation
        const portfolioAllocation1 = await lptoken.balanceOf(defaultAccount)
        assert.equal(fromUsdc(portfolioAllocation1), 100, "Invalid first portfolio allocation")

        // peform second deposit
        await pool.deposit(secondDeposit, { from: defaultAccount })

        const portfolioValue2 = await pool.totalPortfolioValue() 
        assert.equal(fromUsdc(portfolioValue2), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect 300 LP tokens for portfolio allocation
        const portfolioAllocation2 = await lptoken.balanceOf(defaultAccount)
        assert.equal(round(fromUsdc(portfolioAllocation2)), 300, "Invalid second portfolio allocation")

        // expect 300 total portfolio allocation 
        const totalPortfolioLP = await lptoken.totalSupply()
        assert.equal(round(fromUsdc(totalPortfolioLP)), 300, "Invalid total portfolio allocation")

        // expect 100% portfolio allocation
        const precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits precision)
        const portfolioPercentage = await pool.portfolioPercentage(defaultAccount) * 100 / precision
        assert.equal(portfolioPercentage, 100, "Invalid portfolio percentage")
    })


    it("allocates LP tokens to 2 accounts ", async () => {
        let deposit1 = toUsdc('100')
        let deposit2 = toUsdc('200')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue1 = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue1, deposit1 , "Portfolio value should be the same as the initial deposit")

        // expect portfolio allocation for account1 to be 100 LP tokens
        const portfolioAllocation1 = await lptoken.balanceOf(account1)
        assert.equal(fromUsdc(portfolioAllocation1), 100 , "Invalid first portfolio allocation")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        // expect total portfolio value of 300 (the sum of the 2 deposits)
        const portfolioValue2 = await pool.totalPortfolioValue() 
        assert.equal(fromUsdc(portfolioValue2), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect portfolio allocation for account2 to be 200 LP tokens
        const portfolioAllocation2 = await lptoken.balanceOf(account2)
        assert.equal(round(fromUsdc(portfolioAllocation2)), 200 , "Invalid second portfolio allocation")

        // expect 300 total portfolio allocation 
        const totalPortfolioLP = await lptoken.totalSupply()
        assert.equal(round(fromUsdc(totalPortfolioLP)), 300 , "Invalid total portfolio allocation")

        
        // portfolio % for the 2 accounts should be 33.33% 66.66%
        const precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits precision)
        const portfolioPercentage1 = await pool.portfolioPercentage(account1) * 100 / precision
        assert.equal(round(portfolioPercentage1), 33.33)

        const portfolioPercentage2 = await pool.portfolioPercentage(account2) * 100 / precision
        assert.equal(round(portfolioPercentage2), 66.67)
    })

})