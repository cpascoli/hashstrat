const WETH = artifacts.require("WETH");

module.exports = async (deployer, network, [defaultAccount]) => {


  console.log("deploying WETH to ", network)

  if (network.startsWith('kovan')) {
    console.log("Can't deploy WETH to kovan")
  } else {
    const amount = web3.utils.toWei('1000', 'ether')
    deployer.deploy(WETH, amount);
  }

};