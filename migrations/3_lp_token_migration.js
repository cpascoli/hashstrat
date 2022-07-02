
const PoolLPToken = artifacts.require("PoolLPToken");

// Kovan
const DAI_KOVAN = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa'

// MATIC
const USDC_MATIC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'


module.exports = async (deployer, network, [defaultAccount]) => {

  console.log("deploying PoolLPToken to ", network)
  const name = "HashStrat LP (ETHUSD)"
  const symbol = "HSETHUSDLP" 

  if (network.startsWith('develop')) {
    const decimals = 6;   // USDC has 6 decimals
    await deployer.deploy(PoolLPToken, name, symbol, decimals)

  } else if (network.startsWith('matic')) {
    const decimals = 6;   // USDC has 6 decimals
    await deployer.deploy(PoolLPToken, name, symbol, decimals)

  } else if (network.startsWith('kovan')) {
    const decimals = 18;   // DAI uses 18 decimals
    await deployer.deploy(PoolLPToken, name, symbol, decimals)
    
  } else {
    console.log("only for Kovan & Polygon (MATIC) right now!")
  }
};