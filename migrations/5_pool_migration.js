
const Pool = artifacts.require("Pool");

const UNISWAP_V2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
const WETH = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'
const DAI = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'

module.exports = async (deployer, network, [defaultAccount]) => {

  if (!network.startsWith('kovan')) {
    console.log("only for Kovan right now!")
  } else {
    console.log("deploying Pool to ", network)
    deployer.deploy(Pool, UNISWAP_V2_ROUTER, DAI, WETH, 24 * 60 * 60);
  }
};