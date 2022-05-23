const truffleAssert = require("truffle-assertions")
const { round } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")
const PoolLPToken = artifacts.require("PoolLPToken")

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

    // this should match Pool::portFolioPercentagePrecision
    const precision = 10**18

    beforeEach(async () => {
        usdcp = await USDCP.new(web3.utils.toWei('100000', 'ether'))
        weth = await WETH.new(web3.utils.toWei('1000', 'ether'))

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        lptoken = await PoolLPToken.new()
        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, 24 * 60 * 60, {from: defaultAccount});
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPoolAddress(pool.address) //FIXME this is probably unnecessary

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, web3.utils.toWei('10000', 'ether'))
        await weth.transfer(uniswap.address, web3.utils.toWei('1000', 'ether'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, web3.utils.toWei('1000', 'ether'))
        await usdcp.transfer(account2, web3.utils.toWei('1000', 'ether'))
    })


    it("deposit USDCP tokens into the Pool should increase the pool balance", async () => {
        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        // deposit 1 USDCP 
        let depositAmount =  web3.utils.toWei('1', 'ether')
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount, { from: defaultAccount })

        let balanceAfter = await usdcp.balanceOf(pool.address)
        assert.equal(balanceAfter, depositAmount , "Pool should have expected token balance")
    })


    it("gets inital LP tokens when user makes a first deposit", async () => {
        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        // deposit 100 USDCP 
        let depositAmount =  web3.utils.toWei('100', 'ether')
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount, { from: defaultAccount })

        let balanceAfter = await usdcp.balanceOf(pool.address)
        assert.equal(balanceAfter, depositAmount , "Pool should have expected token balance")

        const portfolioValue = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue, depositAmount , "Portfolio value should be the same as initial deposit")

        // expect 100 initial portfolio allocation
        const portfolioAllocation = await pool.portfolioAllocation()
        assert.equal(web3.utils.fromWei(portfolioAllocation, 'ether'), 100 , "Invalid first portfolio allocation")

        // expect 100 total portfolio allocation 
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 100 , "Invalid total portfolio allocation")

        // expect 100% portfolio allocation
        const portfolioPercentage = await pool.portfolioPercentage() * 100 / precision  // (8 digits precision)
        assert.equal(portfolioPercentage, 100 , "Invalid portfolio percentage")
    })


    it("allocates additional LP tokens for second deposit", async () => {
        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let firstDeposit =  web3.utils.toWei('100', 'ether')
        let secondDeposit =  web3.utils.toWei('200', 'ether')

        // allow the ppol to spend both deposits
        await usdcp.approve(pool.address, firstDeposit + secondDeposit)

        // peform first deposit
        await pool.deposit(firstDeposit, { from: defaultAccount })

        const portfolioValue1 = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue1, firstDeposit , "Portfolio value should be the same as the initial deposit")

        // expect 100 initial portfolio allocation
        const portfolioAllocation1 = await pool.portfolioAllocation()
        assert.equal(web3.utils.fromWei(portfolioAllocation1, 'ether'), 100 , "Invalid first portfolio allocation")

        // peform second deposit
        await pool.deposit(secondDeposit, { from: defaultAccount })

        const portfolioValue2 = await pool.totalPortfolioValue() 
        assert.equal(web3.utils.fromWei(portfolioValue2, 'ether'), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect 300 LP tokens for portfolio allocation
        const portfolioAllocation2 = await pool.portfolioAllocation()
        assert.equal(web3.utils.fromWei(portfolioAllocation2, 'ether'), 300 , "Invalid second portfolio allocation")

        // expect 300 total portfolio allocation 
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 300 , "Invalid total portfolio allocation")

        // expect 100% portfolio allocation
        const portfolioPercentage = await pool.portfolioPercentage() * 100 / precision // (8 digits precision)
        assert.equal(portfolioPercentage, 100 , "Invalid portfolio percentage")
    })


    it("allocates LP tokens to 2 accounts ", async () => {
        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let deposit1 =  web3.utils.toWei('100', 'ether')
        let deposit2 =  web3.utils.toWei('200', 'ether')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue1 = await pool.totalPortfolioValue() 
        assert.equal(portfolioValue1, deposit1 , "Portfolio value should be the same as the initial deposit")

        // expect portfolio allocation for account1 to be 100 LP tokens
        const portfolioAllocation1 = await pool.portfolioAllocation({ from: account1 })
        assert.equal(web3.utils.fromWei(portfolioAllocation1, 'ether'), 100 , "Invalid first portfolio allocation")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        // expect total portfolio value of 300 (the sum of the 2 deposits)
        const portfolioValue2 = await pool.totalPortfolioValue() 
        assert.equal(web3.utils.fromWei(portfolioValue2, 'ether'), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect portfolio allocation for account2 to be 200 LP tokens
        const portfolioAllocation2 = await pool.portfolioAllocation({ from: account2 })
        assert.equal(web3.utils.fromWei(portfolioAllocation2, 'ether'), 200 , "Invalid second portfolio allocation")

        // expect 300 total portfolio allocation 
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 300 , "Invalid total portfolio allocation")

        
        // portfolio % for the 2 accounts should be 33.33% 66.66%
        const portfolioPercentage1 = await pool.portfolioPercentage({ from: account1 }) * 100 / precision  // (8 digits precision)
        assert.equal(round(portfolioPercentage1), 33.33)

        const portfolioPercentage2 = await pool.portfolioPercentage({ from: account2 }) * 100 / precision  // (8 digits precision)
        assert.equal(round(portfolioPercentage2), 66.67)

    })


})