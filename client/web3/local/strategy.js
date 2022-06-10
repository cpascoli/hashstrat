import truffleContract from "@truffle/contract";

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
  const contract = truffleContract(artifact); 
  contract.setProvider(window.ethereum);
  return contract.deployed();
}

export const getName = async () => {
    const instance = await getInstance(RebalancingStrategyV1)
    return await instance.name.call()
}

export const getDescription = async () => {
  const instance = await getInstance(RebalancingStrategyV1)
  return await instance.description.call()
}

export const getTargetInvestPercent = async () => {
  const instance = await getInstance(RebalancingStrategyV1)
  return (await instance.targetInvestPerc.call()).toNumber()
}

export const getRebalancingThreshold = async () => {
  const instance = await getInstance(RebalancingStrategyV1)
  return (await instance.rebalancingThreshold.call()).toNumber()
}

export const getPricefeedAddress = async () => {
  const instance = await getInstance(RebalancingStrategyV1)
  return await instance.feed.call()
}

