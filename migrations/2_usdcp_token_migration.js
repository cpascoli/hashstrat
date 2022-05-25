const USDCP = artifacts.require("USDCP");


module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying USDCP to ", network)

  if (network.startsWith('kovan')) {
    console.log("Can't deploy USDCP to kovan")
  } else {
    const amount = web3.utils.toWei('100000', 'ether')
    deployer.deploy(USDCP, amount);
  }

};