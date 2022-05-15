const Migrations = artifacts.require("Migrations");

module.exports = async (deployer, network, [defaultAccount]) => {
  deployer.deploy(Migrations);
};
