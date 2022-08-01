const truffleAssert = require("truffle-assertions")
const { round, toWei, fromWei, fromUsdc, toUsdc } = require("./helpers")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")

const UniswapV2Router = artifacts.require("UniswapV2Router")
const PoolLPToken = artifacts.require("PoolLPToken")
const RebalancingStrategyV1 = artifacts.require("RebalancingStrategyV1");

contract("Pool - swap log", accounts => {

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
        pool = await Pool.new(uniswap.address, uniswap.address, usdcp.address, weth.address, lptoken.address, strategy.address, 24 * 60 * 60);
        
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

    it("A swap should log swap info", async () => {

        await strategy.setRebalancingThreshold(5)
        await uniswap.setPrice(2000)

        // deposit 100 USDCP 
        let depositAmount = toUsdc('100')
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount)

        const price0 = (await priceFeed.getLatestPrice()) / 10**(await priceFeed.decimals())

        assert.equal((await pool.getSwapsInfo()).length, 1 , "1 swap logged")
        assert.equal( (await pool.swaps(0)).feedPrice.toString() , "200000000000" , "initial price")

        // deposit additional 100 USDCP 
        await usdcp.approve(pool.address, depositAmount)
        await pool.deposit(depositAmount)
        
        assert.equal( (await pool.getSwapsInfo()).length, 1 , "still 1 swap logged")
        assert.equal( (await pool.swaps(0)).side , "BUY" , "first swap is BUY")
        assert.equal( (await pool.swaps(0)).feedPrice.toString() , "200000000000" , "still initial price")

        await uniswap.setPrice(4000)

        await pool.invest()

        assert.equal((await pool.getSwapsInfo()).length, 2 , "2 swaps logged")
        assert.equal((await pool.swaps(1)).side , "SELL" , "second swap is SELL")
        assert.equal((await pool.swaps(1)).feedPrice.toString() , "400000000000" , "latest price")
    })

})