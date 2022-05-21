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

    // this should match Pool::portFolioPercentagePrecision
    const precision = 10**18

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
    })


    // Test withdraw function



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

        console.log("portfolio allocation before:", (await pool.portfolioAllocation({from: account1})).toString(),  (await pool.portfolioAllocation({from: account2})).toString())
        console.log("portfolio value before:", web3.utils.fromWei((await pool.portfolioValue({ from: account1 })), 'ether'), web3.utils.fromWei((await pool.portfolioValue({ from: account2 })), 'ether'))
        console.log("usd balance before:", web3.utils.fromWei(( await usdcp.balanceOf(account1)) , 'ether'), web3.utils.fromWei((await usdcp.balanceOf(account2)) , 'ether'))
        console.log(">> Total Portfolio Value before:", web3.utils.fromWei( (await pool.totalPortfolioValue()) , 'ether'))
        console.log(">> portfolio % account1 / account1", (await pool.portfolioPercentage({ from: account1 }) * 100 / precision), (await pool.portfolioPercentage({ from: account2 }) * 100 / precision))

        // Account1 withdraws 20 usd
        let withraw1 =  web3.utils.toWei('20', 'ether')
        await pool.withdraw(withraw1, { from: account1 })

        console.log("portfolio allocation after:", (await pool.portfolioAllocation({from: account1})).toString(),  (await pool.portfolioAllocation({from: account2})).toString())
        console.log("portfolio value after:", web3.utils.fromWei((await pool.portfolioValue({ from: account1 })), 'ether'), web3.utils.fromWei((await pool.portfolioValue({ from: account2 })), 'ether'))
        console.log("usd balance after:", web3.utils.fromWei(( await usdcp.balanceOf(account1)) , 'ether'), web3.utils.fromWei((await usdcp.balanceOf(account2)) , 'ether'))

        console.log(">> Total Portfolio Value after:", web3.utils.fromWei( (await pool.totalPortfolioValue()) , 'ether'))
        console.log(">> portfolio % account1 / account1", (await pool.portfolioPercentage({ from: account1 }) * 100 / precision), (await pool.portfolioPercentage({ from: account2 }) * 100 / precision))

    })


    /*

    it("withdraw of inital deposit", async () => {

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
        const totalPortfolioLP = await pool.totalPortfolioLP.call() 
        assert.equal(web3.utils.fromWei(totalPortfolioLP, 'ether'), 300 , "Invalid total portfolio allocation")

        
        // portfolio % for the 2 accounts should be 33.33% 66.66%
        const portfolioPercentage1 = await pool.portfolioPercentage({ from: account1 }) * 100 / precision // (8 digits precision)
        assert.equal(portfolioPercentage1, 33.333333)

        const portfolioPercentage2 = await pool.portfolioPercentage({ from: account2 }) * 100 / precision // (8 digits precision)
        assert.equal(portfolioPercentage2, 66.666666)

        // swap tokens
        await pool.invest()

         // portfolio % for the 2 accounts should still be 33.33% 66.66%
        const portfolioPercentage1after = await pool.portfolioPercentage({ from: account1 }) * 100 / precision // (8 digits precision)
        assert.equal(portfolioPercentage1, 33.333333)

        const portfolioPercentage2after = await pool.portfolioPercentage({ from: account2 }) * 100 / precision // (8 digits precision)
        assert.equal(portfolioPercentage2, 66.666666)

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

    */

})