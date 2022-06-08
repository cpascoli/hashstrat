import { getBalance as getBalanceLocal, getAllowance as getAllowanceLocal, approve as approveLocal, symbol as symbolLocal } from './local/pool_lp'
import { getBalance as getBalancePolygon, getAllowance as getAllowancePolygon, approve as approvePolygon, symbol as symbolPolygon} from './polygon/pool_lp'
import { getBalance as getBalanceKovan, getAllowance as getAllowanceKovan, approve as approveKovan, symbol as symbolKovan} from './kovan/pool_lp'

import { isPolygon, isKovan, isLocal } from './utils'


export const getBalance = async () => {
    if (isLocal()) return getBalanceLocal()
    else if (isPolygon()) return getBalancePolygon()
    else if (isKovan()) return getBalanceKovan()
}


export const getAllowance = async () => {
    if (isLocal()) return getAllowanceLocal()
    else if (isPolygon()) return getAllowancePolygon()
    else if (isKovan()) return getAllowanceKovan()
}


export const approve = async (amount) => {
    if (isLocal()) return approveLocal(amount)
    else if (isPolygon()) return approvePolygon(amount)
    else if (isKovan()) return approveKovan(amount)
}


export const symbol = async() => {
    if (isLocal()) return symbolLocal()
    else if (isPolygon()) return symbolPolygon()
    else if (isKovan()) return symbolKovan()
}
