
import { getInstance } from './provider'


export const getBalance = async () => {
    return getInstance().getUsdc().getBalance()
}

export const getAllowance = async () => {
    return getInstance().getUsdc().getAllowance()
}

export const approve = async (amount) => {
    return getInstance().getUsdc().approve(amount)
}

export const symbol = async() => {
    return getInstance().getUsdc().symbol()
}
