import { getPortfolioValue as getPortfolioValueLocal, deposit as depositLocal, withdraw as withdrawLocal } from './local/pool'
import { getPortfolioValue as getPortfolioValuePolygon, deposit as depositPolygon, withdraw as withdrawPolygon } from './polygon/pool'
import { isPolygon, isLocal } from './utils'



export const getPortfolioValue = async () => {

    if (isLocal()) return getPortfolioValueLocal()
    else if (isPolygon()) return getPortfolioValuePolygon()
}


export const deposit = async (amount) => {
    if (isLocal()) return depositLocal(amount)
    else if (isPolygon()) return depositPolygon(amount)
}


export const withdraw = async (amount) => {
    if (isLocal()) return withdrawLocal(amount)
    else if (isPolygon()) return withdrawPolygon(amount)
}
  

