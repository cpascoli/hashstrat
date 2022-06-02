import { myWeb3, eth, getInstance } from './provider'
import { toTokenDecimals, toTokenUnits, toNumber, getAccount } from './utils'

import PoolLPToken from "./artifacts/PoolLPToken.json"
import Pool from "./artifacts/Pool.json"


export const getBalance = async () => {
  const poolLP = await getInstance(PoolLPToken)
  const account = await getAccount()
  const balance = await poolLP.balanceOf.call(account)

  return {
      balance: balance.toString(),
      units: await toNumber(poolLP, balance, 4)
  }
}


export const getAllowance = async () => {
  const pool = await getInstance(Pool)
  const poolLP = await getInstance(PoolLPToken)

  const account = await getAccount()
  const allowance = await poolLP.allowance(account, pool.address);
  const allowanceDec = await toNumber(poolLP, allowance, 4)

  return Number(allowanceDec.toString())
}

export const approve = async (amount) => {
  const poolLP = await getInstance(PoolLPToken)
  const pool = await getInstance(Pool)
  const account = await getAccount()

  const tokenDecimals = await toTokenDecimals(poolLP, amount)
  console.log(">>>> poolLP tokenDecimals: ", tokenDecimals)

  const response = await poolLP.approve(pool.address, tokenDecimals, {from: account});
  return response
}


export const symbol = async() => {
  const poolLP = await getInstance(PoolLPToken)
  const response = await poolLP.symbol()
  console.log(">>>> poolLP symbol: ", response)
  return response
}