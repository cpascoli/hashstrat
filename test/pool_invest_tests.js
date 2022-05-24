const truffleAssert = require("truffle-assertions")
const { round, fromWei, toWei } = require("./helpers")

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
        usdcp = await USDCP.new(toWei('100000'))
        weth = await WETH.new(toWei('1000'))

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        lptoken = await PoolLPToken.new()
        strategy = await RebalancingStrategyV1.new(usdcp.address, weth.address, 60, 20)
        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60);
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPoolAddress(pool.address) //FIXME this is probably unnecessary
        await strategy.setPoolAddress(pool.address)

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, toWei('10000'))
        await weth.transfer(uniswap.address, toWei('1000'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toWei('1000'))
        await usdcp.transfer(account2, toWei('1000'))
    })


    // Test invest function

    it("Rebalance portfolio swapping deposit tokens for invest tokens", async () => {

        // deposit 100 USDCP 
        let depositAmount = toWei('100')
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount)

        let balanceUsdcBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceUsdcBefore, depositAmount , "Pool should have the expected deposit tokens")

        let balanceWethBefore = await weth.balanceOf(pool.address)
        assert.equal(balanceWethBefore, 0, "Pool should have no invested tokens")

        // rebalance portfolio to 60%/40%
        await pool.invest()

        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        let balanceWethAfter = await weth.balanceOf(pool.address)

        // calculate expected token balances
        const targetInvestPerc = await strategy.targetInvestPerc.call()
        const price = await priceFeed.getLatestPrice()
        const depositTokensExpected = fromWei(depositAmount) * (100 - targetInvestPerc) / 100
        const invetTokensExpected = (fromWei(depositAmount) - depositTokensExpected) / price

        assert.equal(fromWei(balanceUsdcAfter), depositTokensExpected, "Invalid deposit balance after invest")
        assert.equal(fromWei(balanceWethAfter), invetTokensExpected, "Invalid invest balance after invest")
    })


    it("Portfolio allocation and portfolio value for 2 accounts", async () => {

        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let deposit1 =  web3.utils.toWei('100', 'ether')
        let deposit2 =  web3.utils.toWei('200', 'ether')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

        // expect portfolio allocation for account1 to be 100 LP tokens
        const portfolioAllocation1 = await pool.portfolioAllocation({ from: account1 })
        assert.equal(web3.utils.fromWei(portfolioAllocation1, 'ether'), 100 , "Invalid first portfolio allocation")

        // swap tokens
        await pool.invest()

        const portfolioValueAfterInvest = await pool.totalPortfolioValue() 
        assert.equal(portfolioValueAfterInvest, deposit1 , "Portfolio value should still be the same as the initial deposit")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        // expect total portfolio value of 300 (the sum of the 2 deposits)
        const portfolioValueAfter = await pool.totalPortfolioValue() 
        assert.equal(web3.utils.fromWei(portfolioValueAfter, 'ether'), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect portfolio allocation for account2 to be 200 LP tokens
        const portfolioAllocation2 = await pool.portfolioAllocation({ from: account2 })
        assert.equal(web3.utils.fromWei(portfolioAllocation2, 'ether'), 200 , "Invalid second portfolio allocation")

        // expect 300 total portfolio LP 
        const totalPortfolioLP = await lptoken.totalSupply()
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 300 , "Invalid total portfolio allocation")

        
        // portfolio % for the 2 accounts should be 33.33% 66.66%
        const portfolioPercentage1 = await pool.portfolioPercentage({ from: account1 }) * 100 / precision // (8 digits precision)
        assert.equal(round(portfolioPercentage1), 33.33)

        const portfolioPercentage2 = await pool.portfolioPercentage({ from: account2 }) * 100 / precision // (8 digits precision)
        assert.equal(round(portfolioPercentage2), 66.67)

        // swap tokens
        await pool.invest()

         // portfolio % for the 2 accounts should still be 33.33% 66.66%
        const portfolioPercentage1after = await pool.portfolioPercentage({ from: account1 }) * 100 / precision // (8 digits precision)
        assert.equal(round(portfolioPercentage1), 33.33)

        const portfolioPercentage2after = await pool.portfolioPercentage({ from: account2 }) * 100 / precision // (8 digits precision)
        assert.equal(round(portfolioPercentage2), 66.67)

        const tokenABalance = await usdcp.balanceOf(pool.address)
        const tokenBBalance = await weth.balanceOf(pool.address)

        // portfolio value for account1 and account2
        const portfolioValue1 = await pool.portfolioValue({ from: account1 })
        const portfolioValue1Rounded = Math.round(web3.utils.fromWei(portfolioValue1, 'ether') * 100) / 100
        assert.equal(portfolioValue1Rounded, 100, "Invalid portfolio value for acount1")

        const portfolioValue2 = await pool.portfolioValue({ from: account2 })
        const portfolioValue2Rounded = Math.round(web3.utils.fromWei(portfolioValue2, 'ether') * 100) / 100
        assert.equal(portfolioValue2Rounded, 200, "Invalid portfolio value for account2")
    })


    

})