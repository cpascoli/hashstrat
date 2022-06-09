import { toTokenDecimals, toNumber, getAccount } from '../utils'

import Pool from "../artifacts/Pool.json"
import USDCP from "../artifacts/USDCP.json"
import WETH from "../artifacts/WETH.json"


export const getInterface = () => {
    return {
      getPoolInfo: () => getPoolInfo(),
      getPortfolioInfo: () => getPortfolioInfo(),
      deposit: (amount) => deposit(amount),
      withdraw: (amount) => withdraw(amount),
      address: Pool.address,
    }
}


export const getInstance = artifact => {
    const contractObj = contract(artifact)
    contractObj.setProvider(provider())
  
    return contractObj.deployed();
}
  

export const getPoolInfo = async () => {

    const pool = await getInstance(Pool)
    const usdc = await getInstance(USDCP)
    const weth = await getInstance(WETH)
  
    const usdcDecimals = await usdc.decimals().call()
    const usdcSymbol = await usdc.symbol().call()
    const wethDecimals = await weth.decimals().call()
    const wethSymbol = await weth.symbol().call()
  
    const deposits = await pool.totalDeposited().call()
    const withdrawals = await pool.totalWithdrawn().call()
  
    const depositTokenBalance = await pool.depositTokenBalance().call()
    const investTokenBalance = await pool.investTokenBalance().call()
    const totalPortfolioValue = await pool.totalPortfolioValue().call()
    const investedTokenValue = await pool.investedTokenValue().call()
  
    return {
      deposits: await toNumber(usdcDecimals, deposits, 4),
      withdrawals: await toNumber(usdcDecimals, withdrawals, 4),
      depositTokenBalance: await toNumber(usdcDecimals, depositTokenBalance, 4),
      investTokenBalance:  await toNumber(wethDecimals, investTokenBalance, 4),
      totalPortfolioValue: await toNumber(usdcDecimals, totalPortfolioValue, 4),
      investedTokenValue: await toNumber(usdcDecimals, investedTokenValue, 4),
      
      depositTokenSymbol: usdcSymbol,
      investTokenSymbol: wethSymbol,
    }
}

export const getPortfolioInfo = async () => {

    const pool = await getInstance(Pool)
    const usdc = await getInstance(USDCP)
    const decimals = await usdc.decimals().call()
    const account = await getAccount()
    const portfolioValue = await pool.portfolioValue.call(account)

    const deposited = await pool.getDeposits.call(account)
    const withdrawn = await pool.getWithdrawals.call(account)

    return {
        deposited: await toNumber(decimals, deposited, 4),
        withdrawn: await toNumber(decimals, withdrawn, 4),
        portfolioValue: await toNumber(decimals, portfolioValue, 4),
        depositTokenSymbol: await usdc.symbol().call(),
    }
}


export const deposit = async (amount) => {
    const usdcp = await getInstance(USDCP)
    const pool = await getInstance(Pool)
    const account = await getAccount()
    const decimals = await usdcp.decimals().call()
  
    const tokenDecimals = await toTokenDecimals(decimals, amount)
    const response = await pool.deposit(tokenDecimals, {from: account});
    return response
}

export const withdraw = async (amount) => {
    const usdcp = await getInstance(USDCP)
    const pool = await getInstance(Pool)
    const account = await getAccount()
    const decimals = await usdcp.decimals().call()

    const tokenDecimals = await toTokenDecimals(decimals, amount)
    const response = await pool.withdraw(tokenDecimals, {from: account});
    return response
}
  

