const Pool = artifacts.require('Pool')

/*
  This script makes it easy to read the value of the user allocation to the fund
  $ npx truffle exec scripts/read-portfolio-value.js --network kovan
*/


const userAddress = "0x4F.....1970C" //TODO pass this addrs as a script argument
const depositTokenDecimals = 6
const investTokenDecimals = 18
const pricefeedDecimals = 8
const portFolioPercentagePrecision = 18

module.exports = async callback => {
  const pool = await Pool.deployed()

  console.log("--------- POOL STATS ---------")
  console.log("Pool DAI balance:" , (await pool.depositTokenBalance() / 10**depositTokenDecimals).toString())
  console.log("Pool WETH balance:" , (await pool.investTokenBalance() / 10**investTokenDecimals).toString())
  console.log("Latest WETH price (chainlink feed):" , (await pool.latestPrice() / 10**pricefeedDecimals).toString())
  console.log("Total portfolio Value:", (await pool.totalPortfolioValue() / 10**depositTokenDecimals).toString())
  console.log("--------- USER STATS ---------")
  console.log("User portfolio value:", (await pool.portfolioValue(userAddress) / 10**depositTokenDecimals).toString())
  console.log("User portfolio percentage:", (await pool.portfolioPercentage(userAddress) * 100 / 10**portFolioPercentagePrecision ).toString()+"%")
  
  callback()
}
