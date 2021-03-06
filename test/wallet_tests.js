const truffleAssert = require("truffle-assertions")

const USDCP = artifacts.require("USDCP")
const WalletTest = artifacts.require("WalletTest")


contract("Wallet", accounts => {

    const defaultAccount = accounts[0]
    let wallet
    let usdcp

    beforeEach(async () => {
        usdcp = await USDCP.new(web3.utils.toWei('1000', 'ether'))
        wallet = await WalletTest.new(usdcp.address);
    })


    it("deposit tokens into the wallet should increase the deposit balance", async () => {
        let depositsBefore = await wallet.deposits(defaultAccount)
        assert.equal(depositsBefore, 0, "Account should have no balance")

        // deposit 1 USD
        let depositAmount =  web3.utils.toWei('1', 'ether')
        await usdcp.approve(wallet.address, depositAmount)
        await wallet.deposit(depositAmount)

        let deposits = await wallet.deposits(defaultAccount)
        assert.equal(deposits, depositAmount , "Account should have expected token balance")
    })


    it("withdraw tokens from the wallet should increase the withdrawals balance", async () => {
        let deposits = await wallet.deposits(defaultAccount)
        assert.equal(deposits, 0, "Account should have no deposits")

        // deposit 100 USDCP 
        let depositAmount = 100
        await usdcp.approve(wallet.address, depositAmount)
        await wallet.deposit(depositAmount)

        // withdraw
        let withdrawAmount = 30
        await wallet.withdrawTest(withdrawAmount)

        let withdrawals = await wallet.withdrawals(defaultAccount)
        assert.equal(withdrawals, withdrawAmount , "Account shuld have the expected withdrawals balance")
    })


    it("attempting to withdraw more tokens than available in balance should throw", async () => {
        let deposits = await wallet.deposits(defaultAccount)
        assert.equal(deposits, 0, "Account should have no deposits")

        // deposit 100 tokens 
        let depositAmount = 100
        await usdcp.approve(wallet.address, depositAmount)
        await wallet.deposit(depositAmount)

        // attempt to withdraw 101
        await truffleAssert.reverts(
              wallet.withdrawTest(depositAmount + 1)
        )
    })


})