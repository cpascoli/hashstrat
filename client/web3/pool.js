
import { getInstance } from './provider'


export const getPoolInfo = async () => {
    return getInstance().getPool().getPoolInfo()
}

export const getPortfolioInfo = async () => {
    return getInstance().getPool().getPortfolioInfo()
}

export const deposit = async (amount) => {
    return getInstance().getPool().deposit(amount)
}

export const withdraw = async (amount) => {
    return getInstance().getPool().withdraw(amount)
}
