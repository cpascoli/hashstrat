import { getPoolInfo as getPoolInfoLocal, getPortfolioInfo as getPortfolioInfoLocal, deposit as depositLocal, withdraw as withdrawLocal } from './local/pool'
import { getPoolInfo as getPoolInfoPolygon, getPortfolioInfo as getPortfolioInfoPolygon, deposit as depositPolygon, withdraw as withdrawPolygon } from './polygon/pool'
import { getPoolInfo as getPoolInfoKovan, getPortfolioInfo as getPortfolioInfoKovan, deposit as depositKovan, withdraw as withdrawKovan } from './kovan/pool'

import { isPolygon, isLocal , isKovan } from './utils'


export const getPoolInfo = async () => {
    if (isLocal()) return getPoolInfoLocal()
    else if (isPolygon()) return getPoolInfoPolygon()
    else if (isKovan()) return getPoolInfoKovan()
}

export const getPortfolioInfo = async () => {
    if (isLocal()) return getPortfolioInfoLocal()
    else if (isPolygon()) return getPortfolioInfoPolygon()
    else if (isKovan()) return getPortfolioInfoKovan()
}


export const deposit = async (amount) => {
    if (isLocal()) return depositLocal(amount)
    else if (isPolygon()) return depositPolygon(amount)
    else if (isKovan()) return depositKovan(amount)
}


export const withdraw = async (amount) => {
    if (isLocal()) return withdrawLocal(amount)
    else if (isPolygon()) return withdrawPolygon(amount)
    else if (isKovan()) return withdrawKovan(amount)
}

  

