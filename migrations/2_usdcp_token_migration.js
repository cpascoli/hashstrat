const USDCP = artifacts.require("USDCP");

module.exports = async (deployer, network, [defaultAccount]) => {
  const amount = web3.utils.toWei('1000', 'ether')
  deployer.deploy(USDCP, amount);
};