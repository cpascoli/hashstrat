const WETH = artifacts.require("WETH");

module.exports = async (deployer, network, [defaultAccount]) => {
  const amount = web3.utils.toWei('1000', 'ether')
  deployer.deploy(WETH, amount);
};