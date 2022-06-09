
import { getInstance } from './provider'


export const getName = async () => {
    return getInstance().getStrategy().getName()
}

export const getDescription = async () => {
    return getInstance().getStrategy().getDescription()
}

export const getRebalancingThreshold = async () => {
    return getInstance().getStrategy().getRebalancingThreshold()
}

export const getTargetInvestPercent = async () => {
    return getInstance().getStrategy().getTargetInvestPercent()
}

export const getPricefeedAddress = async () => {
    return getInstance().getStrategy().getPricefeedAddress()
}


export const loadStrategyInfo = () => {

    const instance = getInstance().getStrategy()
    const info = { }
  
    return new Promise((resolve, reject) => {
  
      instance.getName().then( name => {
            info.strategyName = name
            return instance.getDescription()
            
        }).then( description => {
            info.strategyDescription = description
            return instance.getTargetInvestPercent()
  
        }).then( investPerc => {
            info.strategyTargetInvestPercent = investPerc
            return instance.getRebalancingThreshold()
  
        }).then( rebalancingThreshold => {
            info.strategyRebalancingThreshold = rebalancingThreshold
            return instance.getPricefeedAddress()
  
        }).then( address => {
            info.strategyPricefeedAddress = address
  
            resolve(info)
        }).catch((err) => {
            console.log("loadStrategyInfo error:", err);
            reject(err)
        })
    })


    

}
  