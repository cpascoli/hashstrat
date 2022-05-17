const truffleAssert = require("truffle-assertions")

const USDCP = artifacts.require("USDCP")
const WETH = artifacts.require("WETH")
const Pool = artifacts.require("Pool")
const UniswapV2Router = artifacts.require("UniswapV2Router")


contract("Pool", accounts => {

    const defaultAccount = accounts[0]
    let pool

    let uniswap
    let usdcp
    let weth

    beforeEach(async () => {
        usdcp = await USDCP.new(web3.utils.toWei('1000', 'ether'))
        weth = await WETH.new(web3.utils.toWei('1000', 'ether'))
        uniswap = await UniswapV2Router.new(usdcp.address, weth.address)
        pool = await Pool.new(uniswap.address, usdcp.address, weth.address, 24 * 60 * 60, {from: defaultAccount});
        
        await uniswap.setPoolAddress(pool.address)
        await weth.transfer(uniswap.address, web3.utils.toWei('1000', 'ether'))
        //const uniswapBalance = await weth.balanceOf(uniswap.address)
    })

/*
    it("deposit USDCP tokens into the Pool should increase the pool balance", async () => {
        let balanceBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceBefore, 0, "Account should have no balance")

        // deposit 1 USDCP 
        let depositAmount =  web3.utils.toWei('1', 'ether')
        await usdcp.approve(pool.address, depositAmount)

        await pool.deposit(depositAmount, {
            from: defaultAccount, gas: 5000000, gasPrice: 500000000
        })

        let balanceAfter = await usdcp.balanceOf(pool.address)
        assert.equal(balanceAfter, depositAmount , "Pool should have expected token balance")
    })
*/


    it("swaps deposit tokens for invest tokens", async () => {

        // deposit 100 USDCP 
        let depositAmount =  web3.utils.toWei('100', 'ether')
        await usdcp.approve(pool.address, depositAmount)

        await pool.deposit(depositAmount, {
            from: defaultAccount, gas: 5000000, gasPrice: 100000000000
        })

        let balanceUsdcBefore = await usdcp.balanceOf(pool.address)
        assert.equal(balanceUsdcBefore, depositAmount , "Pool should have the expected deposit tokens")

        let balanceWethBefore = await weth.balanceOf(pool.address)
        assert.equal(balanceWethBefore, 0, "Pool should have no invested tokens")

        // swap tokens
        await pool.invest({
            from: defaultAccount, gas: 5000000, gasPrice: 100000000000
        })

        let balanceUsdcAfter = await usdcp.balanceOf(pool.address)
        //assert.equal(balanceUsdcBefore, depositAmount , "Pool should have the expected deposit tokens")
        console.log("balanceUsdcAfter", balanceUsdcAfter.toString())


        let balanceWethAfter = await weth.balanceOf(pool.address)
        //assert.equal(balanceWethBefore, 0, "Pool should have no invested tokens")
        console.log("balanceWethAfter", balanceWethAfter.toString())


    })


})