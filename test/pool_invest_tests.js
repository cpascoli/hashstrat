const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const PoolV2Test = artifacts.require("PoolV2Test")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

contract("Pool - invest", (accounts, network) => {

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
        weth = await WETH.new(toWei('10000'))
        lptoken = await PoolLPToken.new("Pool LP", "POOL-LP", 6)

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        strategy = await RebalancingStrategyV1.new('0x0000000000000000000000000000000000000000', uniswap.address, usdcp.address, weth.address, 60, 2)
        
        pool = await PoolV2Test.new(
            uniswap.address, 
            uniswap.address,  // pricefeed
            usdcp.address, 
            weth.address, 
            lptoken.address, 
            strategy.address, 
            24 * 60 * 60, 
            100,
        )
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPool(pool.address) //FIXME this is probably unnecessary
        await strategy.setPool(pool.address)

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, toUsdc('20000'))
        await weth.transfer(uniswap.address, toWei('200'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toUsdc('1000'))
        await usdcp.transfer(account2, toUsdc('1000'))
        
        precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits precision)
    })


   // Test invest function

    it("Rebalance portfolio swapping deposit tokens for invest tokens", async () => {
        await uniswap.setPrice(2000)

        // deposit 100 USDCP 
        let depositAmount = toUsdc('100')
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount)

        // calculate expected token balances
        const targetInvestPerc = await strategy.targetInvestPerc.call()
        const price0 = (await uniswap.getLatestPrice()) / 10**(await uniswap.decimals())
        const depositTokensExpected0 = fromUsdc(depositAmount) * (100 - targetInvestPerc) / 100
        const investTokensExpected0 = fromUsdc(depositAmount) * targetInvestPerc / 100 / price0
      
        let balanceUsdcBefore = fromUsdc(await usdcp.balanceOf(pool.address))
        let balanceWethBefore = fromWei(await weth.balanceOf(pool.address))
        assert.equal(balanceUsdcBefore, depositTokensExpected0 , "Pool should have the expected deposit tokens")
        assert.equal(balanceWethBefore, investTokensExpected0, "Pool should have no invested tokens")
       
        await uniswap.setPrice(3000)

        // rebalance portfolio to 60%/40%
        await pool.investTest()

        let balanceUsdcAfter = fromUsdc(await usdcp.balanceOf(pool.address))
        let balanceWethAfter = fromWei(await weth.balanceOf(pool.address))

        // calculate expected token balances
        const price1 = (await uniswap.getLatestPrice()) / 10**(await uniswap.decimals())
        const portfolioValue = Number(balanceUsdcBefore) + (Number(balanceWethBefore) * price1)
        const depositTokensExpected1 = portfolioValue * (100 - targetInvestPerc) / 100
        const investTokensExpected1 = portfolioValue * targetInvestPerc / 100 / price1

        assert.equal(balanceUsdcAfter, depositTokensExpected1, "Invalid deposit balance after invest")
        assert.equal(balanceWethAfter, investTokensExpected1, "Invalid invest balance after invest")
    })


    it("Rebalance portfoio with some slippage", async () => {

        const slippage = 0.03
        await uniswap.setPrice(2000)

         // set 5% max slippage and 3% on the trade
        await pool.setSlippageThereshold(500)
        await uniswap.setSlippage(slippage * 10000);

        // transfer 100 USDCP 
        let depositAmount = toUsdc('100')
        await usdcp.transfer(pool.address, depositAmount)

        // rebalance portfolio to 60%/40%
        await pool.investTest()

        let balanceUsdc = fromUsdc(await usdcp.balanceOf(pool.address))
        let balanceWeth = fromWei(await weth.balanceOf(pool.address))

        // calculate expected token balances, including 4% slippage
        const targetInvestPerc = await strategy.targetInvestPerc.call()
        // const price = (await uniswap.getLatestPrice()) / 10**(await uniswap.decimals())
        // const depositTokensExpected = fromUsdc(depositAmount) * (100 - targetInvestPerc) / 100
        // const investTokensExpected = round( (fromUsdc(depositAmount) * targetInvestPerc / 100) / price * 0.96 , 10)


        // calculate expected token balances
        const price = (await uniswap.getLatestPrice()) / 10**(await uniswap.decimals())
        const depositTokensExpected = fromUsdc(depositAmount) * (100 - targetInvestPerc) / 100
        const investTokensExpected = fromUsdc(depositAmount) * targetInvestPerc / 100 / price * (1 - slippage) // account for 3% slippage

        assert.equal(balanceUsdc, depositTokensExpected, "Invalid deposit balance after invest")

        // Invalid invest balance after invest: expected '0.0291' to equal 0.0288
        assert.equal(balanceWeth, round(investTokensExpected, 4), "Invalid invest balance after invest")
    })


    it("Rebalance portfolio with slippage higher than allowed should throw", async () => {
 
         // set 5% max slippage and 5.01% slippage
         await pool.setSlippageThereshold(500)
         await uniswap.setSlippage(501);
 
        // transfer 100 USDCP 
        let depositAmount = toUsdc('100')
        await usdcp.transfer(pool.address, depositAmount)

        await truffleAssert.reverts(
            pool.investTest({ gas: 1000000 })
        )
    })


    it("Portfolio allocation and portfolio value for 2 accounts", async () => {

        let deposit1 = toUsdc('100')
        let deposit2 = toUsdc('200')

        await pool.setSlippageThereshold(0)
        await uniswap.setPrice(2000)  // 100 USDC => 40 USSC + 0.03 ETH

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

        // expect portfolio allocation for account1 to be 100 LP tokens
        const portfolioAllocation1 =  await lptoken.balanceOf(account1)
        assert.equal(fromUsdc(portfolioAllocation1), 100 , "Invalid first portfolio allocation")

        // swap tokens
        await pool.investTest()

        const portfolioValueAfterInvest = await pool.totalPortfolioValue()
        assert.equal(fromUsdc(portfolioValueAfterInvest), fromUsdc(deposit1), "Portfolio value should still be the same as the initial deposit")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        // expect total portfolio value of 300 (the sum of the 2 deposits)
        const portfolioValueAfter = await pool.totalPortfolioValue() 
        assert.equal(fromUsdc(portfolioValueAfter), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect portfolio allocation for account2 to be 200 LP tokens
        const portfolioAllocation2 = await lptoken.balanceOf(account2)
        assert.equal(round(fromUsdc(portfolioAllocation2)), 200 , "Invalid second portfolio allocation")

        // expect 300 total portfolio LP 
        const totalPortfolioLP = await lptoken.totalSupply()
        assert.equal(round(fromUsdc(totalPortfolioLP)), 300 , "Invalid total portfolio allocation")

        
        // portfolio % for the 2 accounts should be 33.33% 66.66%
        const precision = 10 ** (await pool.portfolioPercentageDecimals()) // (8 digits precision)
        const portfolioPercentage1 = await pool.portfolioPercentage(account1) * 100 / precision
        assert.equal(round(portfolioPercentage1), 33.33)

        const portfolioPercentage2 = await pool.portfolioPercentage(account2) * 100 / precision
        assert.equal(round(portfolioPercentage2), 66.67)

        // swap tokens
        await pool.investTest()

        // portfolio % for the 2 accounts should still be 33.33% 66.66%
        const portfolioPercentage1after = await pool.portfolioPercentage(account1) * 100 / precision
        assert.equal(round(portfolioPercentage1after), 33.33)

        const portfolioPercentage2after = await pool.portfolioPercentage(account2) * 100 / precision // (8 digits precision)
        assert.equal(round(portfolioPercentage2after), 66.67)

        // portfolio value for account1 and account2
        const portfolioValue1 = await pool.portfolioValue(account1)
        const portfolioValue1Rounded = round(fromUsdc(portfolioValue1))
        assert.equal(portfolioValue1Rounded, 100, "Invalid portfolio value for acount1")

        const portfolioValue2 = await pool.portfolioValue(account2)
        const portfolioValue2Rounded = round(fromUsdc(portfolioValue2))
        assert.equal(portfolioValue2Rounded, 200, "Invalid portfolio value for account2")
    })

})