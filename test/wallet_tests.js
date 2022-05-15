const truffleAssert = require("truffle-assertions")

const USDCP = artifacts.require("USDCP")
const Wallet = artifacts.require("Wallet")


contract("Wallet", accounts => {

    const defaultAccount = accounts[0]

    beforeEach(async () => {
        // let wallet = await Wallet.deployed()
        // wallet.reset()
    })


    it("deposit USDCP tokens into the wallet should increase the account balance", async () => {
        let wallet = await Wallet.deployed()
        let usdcp = await USDCP.deployed()

        let balanceBefore = await wallet.getBalance()
        assert.equal(balanceBefore, 0, "Account should have no balance")

        const amount = web3.utils.toWei('1', 'ether')

        // deposit 100 USDCP 
        let depositAmount = 100
        await usdcp.approve(wallet.address, depositAmount)
        console.log("approved", depositAmount)

        console.log("depositing", depositAmount)

        const totalSupply = await usdcp.totalSupply()
        console.log("totalSupply", totalSupply.toString())

        const balance = await usdcp.balanceOf(defaultAccount)
        console.log("balance", balance.toString())
        
        const allowance = await usdcp.allowance(defaultAccount, wallet.address)
        console.log("allowance", allowance.toString())
        
        await wallet.deposit(depositAmount, {
            from: defaultAccount,  gas: 5000000, gasPrice: 500000000
        })

        console.log("deposited")

        let balanceAfter = await wallet.getBalance()
        assert.equal(balanceAfter, depositAmount , "Account should have expected token balance")
    })

    // it("withdraw CaleLP tokens from the wallet should reduce the account balance", async () => {
    //     let wallet = await Wallet.deployed()
    //     let usdcp = await USDCP.deployed()

    //     let balance = await wallet.getBalance()
    //     assert.equal(balance, 0, "Account should have no balance")

    //     // deposit 100 USDCP 
    //     let depositAmount = 100
    //     await usdcp.approve(wallet.address, depositAmount)
    //     await wallet.deposit(depositAmount)

    //     // withdraw
    //     await wallet.withdraw(depositAmount)

    //     let balanceAfter = await wallet.getBalance()
    //     assert.equal(balanceAfter, 0 , "Account should have no token after withdraw")

    // })

    // it("attempting to withdraw more CaleLP tokens than available in balance should throw", async () => {
    //     let wallet = await Wallet.deployed()
    //     let usdcp = await USDCP.deployed()

    //     let balance = await wallet.getBalance()
    //     assert.equal(balance, 0, "Account should have no balance")

    //     // deposit 100 USDCP 
    //     let depositAmount = 100
    //     await usdcp.approve(wallet.address, depositAmount)
    //     await wallet.deposit(depositAmount)

    //     await truffleAssert.reverts(
    //           wallet.withdraw(depositAmount + 1)
    //     )

    // })

})