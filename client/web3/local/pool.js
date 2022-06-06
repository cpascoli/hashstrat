import { getInstance } from '../provider'
import { toTokenDecimals, toNumber, getAccount } from '../utils'

import Pool from "../artifacts/Pool.json"
import USDCP from "../artifacts/USDCP.json"


export const getPortfolioValue = async () => {

    const pool = await getInstance(Pool)
    const usdc = await getInstance(USDCP)
    const decimals = await usdc.decimals().call()
    const account = await getAccount()
    const value = await pool.portfolioValue.call(account)

    return {
        value: value.toString(),
        units: await toNumber(decimals, value, 4)
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
  

