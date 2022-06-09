import { toTokenDecimals, toNumber, getAccount } from '../utils'

import WETH from "../artifacts/WETH.json"
import Pool from "../artifacts/Pool.json"


export const getInterface = () => {
  return {
      getBalance: () => getBalance(),
      getAllowance: () => getAllowance(),
      approve: (amount) => approve(amount),
      symbol: () => symbol(),
      address: WETH.address,
  }
}


export const getInstance = artifact => {
  const contractObj = contract(artifact)
  contractObj.setProvider(provider())

  return contractObj.deployed();
}


export const getBalance = async () => {

  console.log('>>>>> local balance: ', balance);

  const weth = await getInstance(WETH)
  const decimals = await weth.decimals.call()
  const account = await getAccount()
  const balance = await weth.balanceOf.call(account)

  return {
      balance: balance.toString(),
      units: await toNumber(decimals, balance, 2)
  }
}


export const getAllowance = async () => {
  const pool = await getInstance(Pool)
  const weth = await getInstance(WETH)
  const decimals = await weth.decimals.call()
  const account = await getAccount()
  const allowance = await weth.allowance(account, pool.address);
  const allowanceDec = await toNumber(decimals, allowance, 2)

  return Number(allowanceDec.toString())
}


export const approve = async (amount) => {
  const weth = await getInstance(WETH)
  const pool = await getInstance(Pool)
  const account = await getAccount()
  const decimals = await weth.decimals.call()
  const tokenDecimals = await toTokenDecimals(decimals, amount)

  const response = await weth.approve(pool.address, tokenDecimals, {from: account});
  return response
}


export const symbol = async() => {
  const weth = await getInstance(WETH)
  const response = await weth.symbol()
  return response
}