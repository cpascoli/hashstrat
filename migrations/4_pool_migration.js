
const Pool = artifacts.require("Pool");

//   constructor(address _depositTokenAddress, address _investTokenAddress, uint _updateInterval) public Wallet(_depositTokenAddress) {

  const WETH = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
  const DAI = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'


module.exports = async (deployer, network, [defaultAccount]) => {

  if (!network.startsWith('kovan')) {
    console.log("only for Kovan right now!")
  } else {
    deployer.deploy(Pool, DAI, WETH, 24 * 60 * 60);
  }
};