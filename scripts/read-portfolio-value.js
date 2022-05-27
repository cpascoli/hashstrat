const Pool = artifacts.require('Pool')

/*
  This script makes it easy to read the value of the user allocation to the fund

   npx truffle exec scripts/read-portfolio-value.js --network kovan
*/

module.exports = async callback => {
  const pool = await Pool.deployed()

  const portfolioValue = (await pool.portfolioValue()).toString()
  console.log("depositTokenBalance:" , (await pool.depositTokenBalance()).toString() )
  console.log("investTokenBalance:" , (await pool.investTokenBalance()).toString() )
  console.log("latestPrice:" , (await pool.latestPrice()).toString() )
  console.log("portfolioValue:", portfolioValue)
  console.log("totalPortfolioValue: ", (await pool.totalPortfolioValue()).toString())
  console.log("portfolioPercentage: ", (await pool.portfolioPercentage() * 100 / 10**18 ).toString())
  
  callback(portfolioValue)
}
