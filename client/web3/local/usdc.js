import truffleContract from "@truffle/contract";

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
  const contract = truffleContract(artifact); 
  contract.setProvider(window.ethereum);
  return contract.deployed();
}


export const getBalance = async () => {
  const usdcp = await getInstance(USDCP)
  const decimals = await usdcp.decimals.call()
  const account = await getAccount()
  const balance = await usdcp.balanceOf.call(account)

  console.log('>>>>> local usdc balance: ', balance);

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
  const response = await usdcp.symbol.call()
  return response
}