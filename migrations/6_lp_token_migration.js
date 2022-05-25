
const PoolLPToken = artifacts.require("PoolLPToken");

module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying PoolLPToken to ", network)

  if (!network.startsWith('kovan')) {
    console.log("only for Kovan right now!")
  } else {
    deployer.deploy(PoolLPToken)
  }
};