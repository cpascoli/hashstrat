import Web3 from "web3"


import { isPolygon, isKovan, isLocal } from "./utils"

import { getInterface as poolPolygon } from './polygon/pool'
import { getInterface as poolLPPolygon } from './polygon/pool_lp'
import { getInterface as usdcPolygon } from './polygon/usdc'
import { getInterface as wethPolygon } from './polygon/weth'

import { getInterface as poolKovan } from './kovan/pool'
import { getInterface as poolLPKovan } from './kovan/pool_lp'
import { getInterface as usdcKovan } from './kovan/usdc'
import { getInterface as wethKovan } from './kovan/weth'


import { getInterface as poolLocal } from './local/pool'
import { getInterface as poolLPLocal } from './local/pool_lp'
import { getInterface as usdcLocal } from './local/usdc'
import { getInterface as wethLocal } from './local/weth'

const provider = () => {
  // If the user has MetaMask:
  if (typeof web3 !== 'undefined') {
    return web3.currentProvider
  } else {
    console.error("You need to install MetaMask for this app to work!")
  }
}

export const eth = new Web3(provider()).eth
export const myWeb3 = new Web3(provider())

export const getInstance = artifact => {

  if (isPolygon()) {
    return {
      getPool: () => poolPolygon(),
      getPoolLP: () => poolLPPolygon(),
      getUsdc: () => usdcPolygon(),
      getWeth: () => wethPolygon(),
    }
  }
  
  if (isKovan()) {
    return {
      getPool: () => poolKovan(),
      getPoolLP: () => poolLPKovan(),
      getUsdc: () => usdcKovan(),
      getWeth: () => wethKovan(),
    }
  }

  if (isLocal()) {
    return {
      getPool: () => poolLocal(),
      getPoolLP: () => poolLPLocal(),
      getUsdc: () => usdcLocal(),
      getWeth: () => wethLocal(),
    }
  }

  throw `Network ${process.env.NEXT_PUBLIC_NETWORK} not supported`
}

