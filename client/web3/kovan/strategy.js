import Web3 from "web3"

/// Strategy contract on Kovan
export const contract_address = '0x4Cb5BAb3555Ae81f41AC9999092aa610b9a49caa';


export const getInterface = () => {
  return {
      getName: () => getName(),
      getDescription: () => getDescription(),
      getTargetInvestPercent: () => getTargetInvestPercent(),
      getRebalancingThreshold: () => getRebalancingThreshold(),
      getPricefeedAddress: () => getPricefeedAddress(),
      address: contract_address,
  }
}


export const getInstance = async () => {
    const web3 = new Web3(window.ethereum);
    return new web3.eth.Contract(abi, contract_address)
}

export const getName = async () => {
    const instance = await getInstance()
    return await instance.methods.name().call()
}

export const getDescription = async () => {
  const instance = await getInstance()
  return await instance.methods.description().call()
}

export const getTargetInvestPercent = async () => {
  const instance = await getInstance()
  return await instance.methods.targetInvestPerc().call()
}

export const getRebalancingThreshold = async () => {
  const instance = await getInstance()
  return await instance.methods.rebalancingThreshold().call()
}

export const getPricefeedAddress = async () => {
  const instance = await getInstance()
  return await instance.methods.feed().call()
}




const abi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_poolAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_feedAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_depositTokenAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_investTokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_targetInvestPerc",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_rebalancingThreshold",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investPerc",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "investTokenValue",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "upperBound",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "lowerBound",
        "type": "uint256"
      }
    ],
    "name": "StrategyInfo",
    "type": "event"
  },
  {
    "inputs": [
      
    ],
    "name": "depositToken",
    "outputs": [
      {
        "internalType": "contract IERC20Metadata",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "description",
    "outputs": [
      {
        "internalType": "string",
        "name": "_",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "evaluate",
    "outputs": [
      {
        "internalType": "enum StrategyAction",
        "name": "",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "feed",
    "outputs": [
      {
        "internalType": "contract IPriceFeed",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "investToken",
    "outputs": [
      {
        "internalType": "contract IERC20Metadata",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "maxPriceAge",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "_",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "pool",
    "outputs": [
      {
        "internalType": "contract IPool",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "rebalancingThreshold",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "renounceOwnership",
    "outputs": [
      
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "secs",
        "type": "uint256"
      }
    ],
    "name": "setMaxPriceAge",
    "outputs": [
      
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_poolAddress",
        "type": "uint256"
      }
    ],
    "name": "setPool",
    "outputs": [
      
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_rebalancingThreshold",
        "type": "uint256"
      }
    ],
    "name": "setRebalancingThreshold",
    "outputs": [
      
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_targetInvestPerc",
        "type": "uint256"
      }
    ],
    "name": "setTargetInvestPerc",
    "outputs": [
      
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      
    ],
    "name": "targetInvestPerc",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [
      
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]