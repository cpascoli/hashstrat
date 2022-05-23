// const { assert } = require("console")
const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei } = require("./helpers")

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
        usdcp = await USDCP.new(toWei('100000'))
        weth = await WETH.new(toWei('1000'))
        lptoken = await PoolLPToken.new()

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, lptoken.address, 24 * 60 * 60, {from: defaultAccount});
        
        await lptoken.addMinter(pool.address)
        await lptoken.renounceMinter()
        await uniswap.setPoolAddress(pool.address) //FIXME this is probably unnecessary

        // Give the mock uniswap some USD/WETH liquidity to uniswap to performs some swaps
        await usdcp.transfer(uniswap.address, web3.utils.toWei('10000', 'ether'))
        await weth.transfer(uniswap.address, web3.utils.toWei('1000', 'ether'))

        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, toWei('1000'))
        await usdcp.transfer(account2, toWei('1000'))
    })


    it("withdraw of inital deposit", async () => {

        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let deposit1 =  web3.utils.toWei('60', 'ether')
        let deposit2 =  web3.utils.toWei('100', 'ether')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue()
        assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        assert.equal(fromWei(( await usdcp.balanceOf(account1))), 940, "Invalid account1 balance before")
        assert.equal(fromWei(( await usdcp.balanceOf(account2))), 900, "Invalid account2 balance before")
        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 60 , "Invalid account1 portfolio value")
        assert.equal(fromWei((await pool.portfolioValue({ from: account2 }))), 100 , "Invalid account2 portfolio value")
        assert.equal(fromWei((await pool.totalPortfolioValue()) , 'ether'), 160, "Invalid total portfolio value before")
        assert.equal((await pool.portfolioPercentage({ from: account1 })) * 100 / precision, 37.5, "Invalid account1 portfolio % before")
        assert.equal((await pool.portfolioPercentage({ from: account2 })) * 100 / precision, 62.5, "Invalid account2 portfolio % before")
        
        // Account1 withdraws 20 usd
        let withraw1 =  web3.utils.toWei('20', 'ether')
        await pool.withdraw(withraw1, { from: account1 })

        assert.equal(fromWei((await usdcp.balanceOf(account1))), 960, "Invalid account1 balance after")
        assert.equal(fromWei((await usdcp.balanceOf(account2))), 900, "Invalid account2 balance after")
        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 40 , "Invalid account1 portfolio value after")
        assert.equal(fromWei((await pool.portfolioValue({ from: account2 }))), 100 , "Invalid account2 portfolio value after")
        assert.equal(fromWei((await pool.totalPortfolioValue()) , 'ether'), 140, "Invalid total portfolio value")
        assert.equal(round((await pool.portfolioPercentage({ from: account1 })) * 100 / precision), 28.57, "Invalid account1 portfolio % before")
        assert.equal(round((await pool.portfolioPercentage({ from: account2 })) * 100 / precision), 71.43, "Invalid account2 portfolio % before")
        
    })



    it("withdraw after price increase", async () => {

        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        let deposit1 =  web3.utils.toWei('60', 'ether')
        let deposit2 =  web3.utils.toWei('100', 'ether')

        // peform deposit for account1
        await usdcp.approve(pool.address, deposit1, { from: account1 })
        await pool.deposit(deposit1, { from: account1 })

        const portfolioValue = await pool.totalPortfolioValue()
        assert.equal(portfolioValue, deposit1 , "Portfolio value should be the same as the initial deposit")

        // peform deposit for account2
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        assert.equal(fromWei(( await usdcp.balanceOf(account1))), 940, "Invalid account1 balance before")
        assert.equal(fromWei(( await usdcp.balanceOf(account2))), 900, "Invalid account2 balance before")
        
        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 60 , "Invalid account1 portfolio value")
        assert.equal(fromWei((await pool.portfolioValue({ from: account2 }))), 100 , "Invalid account2 portfolio value")
        assert.equal(fromWei((await pool.totalPortfolioValue()) , 'ether'), 160, "Invalid total portfolio value before")

        assert.equal((await pool.portfolioPercentage({ from: account1 })) * 100 / precision, 37.5, "Invalid account1 portfolio % before")
        assert.equal((await pool.portfolioPercentage({ from: account2 })) * 100 / precision, 62.5, "Invalid account2 portfolio % before")
  
        // invest some tokens
        await pool.invest()

        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 60, "Invalid portfolio value for account1 after withdrawal")
        assert.equal(fromWei((await pool.portfolioValue({ from: account2 }))), 100, "Invalid portfolio value for account2 after withdrawal")
        assert.equal(fromWei((await pool.totalPortfolioValue())), 160, "Invalid total portfolio value for account2 after withdrawal")
        
        // token price goes up
        await uniswap.setPrice(3)

        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 63, "Invalid portfolio value for account1")
        assert.equal(fromWei((await pool.portfolioValue({ from: account2 }))), 105, "Invalid portfolio value for account2")
        assert.equal(fromWei((await pool.totalPortfolioValue())), 168, "Invalid total portfolio value for account2 after withdrawal")

        // account1 withdraws all 
        const value1a = await pool.portfolioValue({ from: account1 })
        await pool.withdraw(value1a, { from: account1 })

        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 0, "Invalid portfolio value for account1 after withdrawal")
        assert.equal(fromWei((await pool.portfolioValue({ from: account2 }))), 105, "Invalid portfolio value for account2 after withdrawal")
        assert.equal(fromWei((await pool.totalPortfolioValue())), 105, "Invalid total portfolio value for account2 after withdrawal")

        // account2 withdraws all 
        const value2a = await pool.portfolioValue({ from: account2 }) 
        await pool.withdraw(value2a, { from: account2 })
        
        assert.equal(fromWei((await pool.portfolioValue({ from: account1 }))), 0, "Invalid portfolio value for account1 after withdrawal")
        assert.equal(round(fromWei((await pool.portfolioValue({ from: account2 }))), 10), 0, "Invalid portfolio value for account2 after withdrawal")
        assert.equal(round(fromWei((await pool.totalPortfolioValue())), 10), 0, "Invalid total portfolio value for account2 after withdrawal")

    })



})