const truffleAssert = require("truffle-assertions")

const USDCP = artifacts.require("USDCP")
const Wallet = artifacts.require("Wallet")


contract("Wallet", accounts => {

    const defaultAccount = accounts[0]
    let wallet
    let usdcp

    beforeEach(async () => {
        usdcp = await USDCP.new(web3.utils.toWei('1000', 'ether'))
        wallet = await Wallet.new(usdcp.address, {from: defaultAccount});
    })


    it("deposit USDCP tokens into the wallet should increase the account balance", async () => {
        let balanceBefore = await wallet.getBalance()
        assert.equal(balanceBefore, 0, "Account should have no balance")

        // deposit 1 USDCP 
        let depositAmount =  web3.utils.toWei('1', 'ether')
        await usdcp.approve(wallet.address, depositAmount)

        await wallet.deposit(depositAmount, {
            from: defaultAccount, gas: 5000000, gasPrice: 500000000
        })

        console.log("deposited")

        let balanceAfter = await wallet.getBalance()
        assert.equal(balanceAfter, depositAmount , "Account should have expected token balance")
    })


    it("withdraw USDCP tokens from the wallet should reduce the account balance", async () => {

        let balance = await wallet.getBalance()
        assert.equal(balance, 0, "Account should have no balance")

        // deposit 100 USDCP 
        let depositAmount = 100
        await usdcp.approve(wallet.address, depositAmount)
        await wallet.deposit(depositAmount)

        // withdraw
        let withdrawAmount = 30
        await wallet.withdraw(withdrawAmount)

        let balanceAfter = await wallet.getBalance()
        assert.equal(balanceAfter, depositAmount - withdrawAmount , "Account should have 70 token after withdraw")

    })

    it("attempting to withdraw more CaleLP tokens than available in balance should throw", async () => {
        let balance = await wallet.getBalance()
        assert.equal(balance, 0, "Account should have no balance")

        // deposit 100 USDCP 
        let depositAmount = 100
        await usdcp.approve(wallet.address, depositAmount)
        await wallet.deposit(depositAmount)

        await truffleAssert.reverts(
              wallet.withdraw(depositAmount + 1)
        )
    })

})