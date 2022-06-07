import { getPoolInfo as getPoolInfoLocal, getPortfolioInfo as getPortfolioInfoLocal, deposit as depositLocal, withdraw as withdrawLocal } from './local/pool'
import { getPoolInfo as getPoolInfoPolygon, getPortfolioInfo as getPortfolioInfoPolygon, deposit as depositPolygon, withdraw as withdrawPolygon } from './polygon/pool'
import { isPolygon, isLocal } from './utils'


export const getPoolInfo = async () => {
    if (isLocal()) return getPoolInfoLocal()
    else if (isPolygon()) return getPoolInfoPolygon()
}

export const getPortfolioInfo = async () => {
    if (isLocal()) return getPortfolioInfoLocal()
    else if (isPolygon()) return getPortfolioInfoPolygon()
}


export const deposit = async (amount) => {
    if (isLocal()) return depositLocal(amount)
    else if (isPolygon()) return depositPolygon(amount)
}


export const withdraw = async (amount) => {
    if (isLocal()) return withdrawLocal(amount)
    else if (isPolygon()) return withdrawPolygon(amount)
}

  

