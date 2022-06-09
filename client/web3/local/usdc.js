import { toTokenDecimals, toNumber, getAccount } from '../utils'

import USDCP from "../artifacts/USDCP.json"
import Pool from "../artifacts/Pool.json"


export const getInterface = () => {
  return {
      getBalance: () => getBalance(),
      getAllowance: () => getAllowance(),
      approve: (amount) => approve(amount),
      symbol: () => symbol(),
      address: USDCP.address,
  }
}


export const getInstance = artifact => {
  const contractObj = contract(artifact)
  contractObj.setProvider(provider())

  return contractObj.deployed();
}


export const getBalance = async () => {

  console.log('>>>>> local balance: ', balance);

  const usdcp = await getInstance(USDCP)
  const decimals = await usdcp.decimals.call()
  const account = await getAccount()
  const balance = await usdcp.balanceOf.call(account)

  return {
      balance: balance.toString(),
      units: await toNumber(decimals, balance, 2)
  }
}


export const getAllowance = async () => {
  const pool = await getInstance(Pool)
  const usdcp = await getInstance(USDCP)
  const decimals = await usdcp.decimals.call()
  const account = await getAccount()
  const allowance = await usdcp.allowance(account, pool.address);
  const allowanceDec = await toNumber(decimals, allowance, 2)

  return Number(allowanceDec.toString())
}


export const approve = async (amount) => {
  const usdcp = await getInstance(USDCP)
  const pool = await getInstance(Pool)
  const account = await getAccount()
  const decimals = await usdcp.decimals.call()
  const tokenDecimals = await toTokenDecimals(decimals, amount)

  const response = await usdcp.approve(pool.address, tokenDecimals, {from: account});
  return response
}


export const symbol = async() => {
  const usdcp = await getInstance(USDCP)
  const response = await usdcp.symbol()
  return response
}