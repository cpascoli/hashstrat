const truffleAssert = require("truffle-assertions")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PriceConsumerV3 = artifacts.require("PriceConsumerV3")

contract("Pool", accounts => {

    const defaultAccount = accounts[0]
    const account1 = accounts[1]
    const account2 = accounts[2]

    let pool

    let uniswap
    let usdcp
    let weth
    let priceFeed

    beforeEach(async () => {
        usdcp = await USDCP.new(web3.utils.toWei('100000', 'ether'))
        weth = await WETH.new(web3.utils.toWei('1000', 'ether'))

        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        priceFeed = await PriceConsumerV3.new(uniswap.address)  // UniswapV2Router also provides mock price feed
        
        pool = await Pool.new(uniswap.address, priceFeed.address, usdcp.address, weth.address, 24 * 60 * 60, {from: defaultAccount});
        
        await uniswap.setPoolAddress(pool.address) //FIXME this is probably unnecessary

        // Give some WETH liquidity to uniswap to performs some swaps
        await weth.transfer(uniswap.address, web3.utils.toWei('1000', 'ether'))
     
        // Give some inital usdcp tokens to account1 and account2
        await usdcp.transfer(account1, web3.utils.toWei('1000', 'ether'))
        await usdcp.transfer(account2, web3.utils.toWei('1000', 'ether'))

        const balance1 = await usdcp.balanceOf(account1)
        const balance2 = await usdcp.balanceOf(account2)

        console.log("account1 balance: ", web3.utils.fromWei(balance1, 'ether'))
        console.log("account2 balance: ", web3.utils.fromWei(balance2, 'ether'))

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

        const portfolioValue = await pool.portfioValue() 
        assert.equal(portfolioValue, depositAmount , "Portfolio value should be the same as initial deposit")

        // expect 100 initial portfolio allocation
        const portfolioAllocation = await pool.portfolioAllocation()
        console.log("portfolioAllocation:", portfolioAllocation.toString(), web3.utils.fromWei(portfolioAllocation, 'ether'))
        assert.equal(web3.utils.fromWei(portfolioAllocation, 'ether'), 100 , "Invalid first portfolio allocation")

        // expect 100 total portfolio allocation 
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        console.log("totalPortfolioLP:", totalPortfolioLP.toString(), web3.utils.fromWei(totalPortfolioLP, 'ether'))
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 100 , "Invalid total portfolio allocation")

        // expect 100% portfolio allocation
        const portfolioPercentage = await pool.portfolioPercentage() / 100 // (4 digits precision)
        console.log("portfolioPercentage:", portfolioPercentage.toString())
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

        const portfolioValue1 = await pool.portfioValue() 
        assert.equal(portfolioValue1, firstDeposit , "Portfolio value should be the same as the initial deposit")

        // expect 100 initial portfolio allocation
        const portfolioAllocation1 = await pool.portfolioAllocation()
        assert.equal(web3.utils.fromWei(portfolioAllocation1, 'ether'), 100 , "Invalid first portfolio allocation")

        // peform second deposit
        await pool.deposit(secondDeposit, { from: defaultAccount })

        const portfolioValue2 = await pool.portfioValue() 
        assert.equal(web3.utils.fromWei(portfolioValue2, 'ether'), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect 300 LP tokens for portfolio allocation
        const portfolioAllocation2 = await pool.portfolioAllocation()
        assert.equal(web3.utils.fromWei(portfolioAllocation2, 'ether'), 300 , "Invalid second portfolio allocation")

        // expect 300 total portfolio allocation 
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 300 , "Invalid total portfolio allocation")

        // expect 100% portfolio allocation
        const portfolioPercentage = await pool.portfolioPercentage() / 100 // (4 digits precision)
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

        const portfolioValue1 = await pool.portfioValue() 
        assert.equal(portfolioValue1, deposit1 , "Portfolio value should be the same as the initial deposit")


        // expect portfolio allocation for account1 to be 100 LP tokens
        const portfolioAllocation1 = await pool.portfolioAllocation({ from: account1 })
        assert.equal(web3.utils.fromWei(portfolioAllocation1, 'ether'), 100 , "Invalid first portfolio allocation")

        // peform deposit for second account
        await usdcp.approve(pool.address, deposit2, { from: account2 })
        await pool.deposit(deposit2, { from: account2 })

        // expect total portfolio value of 300
        const portfolioValue2 = await pool.portfioValue() 
        assert.equal(web3.utils.fromWei(portfolioValue2, 'ether'), 300, "Portfolio value should be the sum of the 2 deposits")

        // expect portfolio allocation for account2 to be 200 LP tokens
        const portfolioAllocation2 = await pool.portfolioAllocation({ from: account2 })
        assert.equal(web3.utils.fromWei(portfolioAllocation2, 'ether'), 200 , "Invalid second portfolio allocation")

        // expect 300 total portfolio allocation 
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 300 , "Invalid total portfolio allocation")

        
        // portfolio % for the 2 accounts should be 33.33% 66.66%
        const portfolioPercentage1 = await pool.portfolioPercentage({ from: account1 }) / 100 // (4 digits precision)
        console.log("portfolioPercentage1:", portfolioPercentage1.toString())
        assert.equal(portfolioPercentage1, 33.33)

        const portfolioPercentage2 = await pool.portfolioPercentage({ from: account2 }) / 100 // (4 digits precision)
        console.log("portfolioPercentage2:", portfolioPercentage2.toString())
        assert.equal(portfolioPercentage2, 66.66)

    })


    // Test invest function

    it("swap deposit tokens for invest tokens", async () => {

        // deposit 100 USDCP 
        let depositAmount =  web3.utils.toWei('100', 'ether')
        await usdcp.approve(pool.address, depositAmount)

        await pool.deposit(depositAmount, { from: defaultAccount })

        let balanceUsdcBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceUsdcBefore, depositAmount , "Pool should have the expected deposit tokens")

        let balanceWethBefore = await weth.balanceOf(pool.address)
        assert.equal(balanceWethBefore, 0, "Pool should have no invested tokens")

        // swap tokens
        ///await pool.invest({ from: defaultAccount, gas: 5000000, gasPrice: 100000000000 })
        await pool.invest()

        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        //assert.equal(balanceUsdcBefore, depositAmount , "Pool should have the expected deposit tokens")
        console.log("balanceUsdcAfter", balanceUsdcAfter.toString())

        let balanceWethAfter = await weth.balanceOf(pool.address)
        //assert.equal(balanceWethBefore, 0, "Pool should have no invested tokens")
        console.log("balanceWethAfter", balanceWethAfter.toString())
    })
    

})