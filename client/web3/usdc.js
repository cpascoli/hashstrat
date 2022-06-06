import { getBalance as getBalanceLocal, getAllowance as getAllowanceLocal, approve as approveLocal, symbol as symbolLocal } from './local/usdc'
import { getBalance as getBalancePolygon, getAllowance as getAllowancePolygon, approve as approvePolygon, symbol as symbolPolygon} from './polygon/usdc'
import { isPolygon, isLocal } from './utils'


export const getBalance = async () => {
    if (isLocal()) return getBalanceLocal()
    else if (isPolygon()) return getBalancePolygon()
}


export const getAllowance = async () => {
    if (isLocal()) return getAllowanceLocal()
    else if (isPolygon()) return getAllowancePolygon()
}


export const approve = async (amount) => {
    if (isLocal()) return approveLocal(amount)
    else if (isPolygon()) return approvePolygon(amount)
}


export const symbol = async() => {
    if (isLocal()) return symbolLocal()
    else if (isPolygon()) return symbolPolygon()
}
