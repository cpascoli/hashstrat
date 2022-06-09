
import { getInstance } from './provider'


export const getBalance = async () => {
    return getInstance().getPoolLP().getBalance()
}

export const getAllowance = async () => {
    return getInstance().getPoolLP().getAllowance()
}

export const approve = async (amount) => {
    return getInstance().getPoolLP().approve(amount)
}

export const symbol = async() => {
    return getInstance().getPoolLP().symbol()
}
