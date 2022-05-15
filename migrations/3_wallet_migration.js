const USDCP = artifacts.require("USDCP");
const Wallet = artifacts.require("Wallet");

module.exports = async (deployer, network, [defaultAccount]) => {
  deployer.deploy(Wallet, USDCP.address);
};