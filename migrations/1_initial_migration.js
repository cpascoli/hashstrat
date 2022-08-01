const Migrations = artifacts.require("Migrations");

var publicChains = ['matic'];


module.exports = async (deployer, network, [defaultAccount]) => {
  if(publicChains.includes(network)) {
    return; //We don't want a Migrations contract on the mainnet, don't waste gas.
  }

  deployer.deploy(Migrations);
};
