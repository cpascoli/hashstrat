import truffleContract from "@truffle/contract";

import { toTokenDecimals, toNumber, getAccount } from '../utils'
import PoolLPToken from "../artifacts/PoolLPToken.json"
import Pool from "../artifacts/Pool.json"


export const getInterface = () => {
  return {
      getBalance: () => getBalance(),
      getAllowance: () => getAllowance(),
      approve: (amount) => approve(amount),
      symbol: () => symbol(),
      address: PoolLPToken.address,
  }
}


export const getInstance = artifact => {
  const contract = truffleContract(artifact); 
  contract.setProvider(window.ethereum);
  return contract.deployed();
}


export const getBalance = async () => {
  const poolLP = await getInstance(PoolLPToken)
  const account = await getAccount()
  const balance = await poolLP.balanceOf.call(account)
  const decimals = await poolLP.decimals.call()
  console.log('>>>>> local poollp balance: ', balance);

  return {
      balance: balance.toString(),
      units: await toNumber(decimals, balance, 4)
  }
}


export const getAllowance = async () => {
  const pool = await getInstance(Pool)
  const poolLP = await getInstance(PoolLPToken)
  const decimals = await poolLP.decimals.call()

  const account = await getAccount()
  const allowance = await poolLP.allowance(account, pool.address);
  const allowanceDec = await toNumber(decimals, allowance, 4)

  return Number(allowanceDec.toString())
}

export const approve = async (amount) => {
  const poolLP = await getInstance(PoolLPToken)
  const pool = await getInstance(Pool)
  const account = await getAccount()
  const decimals = await poolLP.decimals.call()

  const tokenDecimals = await toTokenDecimals(decimals, amount)
  const response = await poolLP.approve(pool.address, tokenDecimals, {from: account});
  return response
}


export const symbol = async() => {
  const poolLP = await getInstance(PoolLPToken)
  const response = await poolLP.symbol.call()
  return response
}