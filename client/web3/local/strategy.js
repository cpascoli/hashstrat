import Web3 from "web3"
import RebalancingStrategyV1 from "../artifacts/RebalancingStrategyV1.json"



export const getInterface = () => {
  return {
      getName: () => getName(),
      getDescription: () => getDescription(),
      getTargetInvestPercent: () => getTargetInvestPercent(),
      getRebalancingThreshold: () => getRebalancingThreshold(),
      getPricefeedAddress: () => getPricefeedAddress(),
      address: RebalancingStrategyV1.address,
  }
}


export const getInstance = artifact => {
  const contractObj = contract(artifact)
  contractObj.setProvider(provider())

  return contractObj.deployed();
}


export const getName = async () => {
    const instance = await getInstance(RebalancingStrategyV1)
    return await instance.name().call()
}

export const getDescription = async () => {
  const instance = await getInstance()
  return await instance.description().call()
}

export const getTargetInvestPercent = async () => {
  const instance = await getInstance()
  return await instance.targetInvestPerc().call()
}

export const getRebalancingThreshold = async () => {
  const instance = await getInstance()
  return await instance.rebalancingThreshold().call()
}

export const getPricefeedAddress = async () => {
  const instance = await getInstance()
  return await instance.feed().call()
}

