import { myWeb3, eth, getInstance } from './provider'
import { toTokenDecimals, toTokenUnits, toNumber, getAccount } from './utils'

import USDCP from "./artifacts/USDCP.json"
import Pool from "./artifacts/Pool.json"


export const getBalance = async () => {
  const usdcp = await getInstance(USDCP)
  const account = await getAccount()
  const balance = await usdcp.balanceOf.call(account)

  return {
      balance: balance.toString(),
      units: await toNumber(usdcp, balance, 2)
  }
}


export const getAllowance = async () => {
  const pool = await getInstance(Pool)
  const usdcp = await getInstance(USDCP)

  const account = await getAccount()
  const allowance = await usdcp.allowance(account, pool.address);
  const allowanceDec = await toNumber(usdcp, allowance, 2)

  return Number(allowanceDec.toString())
}

export const approve = async (amount) => {
  const usdcp = await getInstance(USDCP)
  const pool = await getInstance(Pool)
  const account = await getAccount()

  const tokenDecimals = await toTokenDecimals(usdcp, amount)
  console.log(">>>> usdcp tokenDecimals: ", tokenDecimals)

  const response = await usdcp.approve(pool.address, tokenDecimals, {from: account});
  return response
}


export const symbol = async() => {
  const usdcp = await getInstance(USDCP)
  const response = await usdcp.symbol()
  console.log(">>>> usdcp symbol: ", response)
  return response
}