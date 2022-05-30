const Wallet = artifacts.require("Wallet");

const DAI = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying Wallet to ", network)

  if (!network.startsWith('kovan')) {
    console.log("only for Kovan right now!")
  } else {
    deployer.deploy(Wallet, DAI);
  }
};