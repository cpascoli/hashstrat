const Pool = artifacts.require('Pool')

/*
  This script makes it easy to read the value of the user allocation to the fund

   npx truffle exec scripts/read-portfolio-value.js --network kovan
*/

module.exports = async callback => {
  const pool = await Pool.deployed()

  const portfolioValue = await pool.portfolioValue()
  console.log("--------- POOL STATS ---------")
  console.log("Pool DAI balance:" , (await pool.depositTokenBalance() / 10**18 ).toString())
  console.log("Pool WETH balance:" , (await pool.investTokenBalance() / 10**18).toString())
  console.log("Latest WETH price (chainlink feed):" , (await pool.latestPrice() / 10**8).toString())
  console.log("Total portfolio Value:", (await pool.totalPortfolioValue() / 10**18).toString())
  console.log("--------- USER STATS ---------")
  console.log("User portfolio value:", portfolioValue / 10**18)
  console.log("User portfolio percentage:", (await pool.portfolioPercentage() * 100 / 10**18 ).toString()+"%")
  
  callback()
}
