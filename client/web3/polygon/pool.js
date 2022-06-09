import Web3 from "web3"
import { toTokenDecimals, toNumber, getAccount } from '../utils'
import { getInstance as getInstanceUSDC } from './usdc'
import { getInstance as getInstanceWETH } from './weth'


/// Pool contract on Polygon/MATIC
export const contract_address = '0x1Df1D2057D1d4126398C001ea855a60b277c249E';


export const getInterface = () => {
  return {
    getPoolInfo: () => getPoolInfo(),
    getPortfolioInfo: () => getPortfolioInfo(),
    deposit: (amount) => deposit(amount),
    withdraw: (amount) => withdraw(amount),
  }
}



export const getInstance = async () => {
  const web3 = new Web3(window.ethereum);
  // var web3 = new Web3(web3.currentProvider);
  return new web3.eth.Contract(abi, contract_address)
}


export const getPoolInfo = async () => {

  const pool = await getInstance()
  const usdc = await getInstanceUSDC()
  const weth = await getInstanceWETH()

  const usdcDecimals = await usdc.methods.decimals().call()
  const usdcSymbol = await usdc.methods.symbol().call()
  const wethDecimals = await weth.methods.decimals().call()
  const wethSymbol = await weth.methods.symbol().call()

  const deposits = await pool.methods.totalDeposited().call()
  const withdrawals = await pool.methods.totalWithdrawn().call()

  const depositTokenBalance = await pool.methods.depositTokenBalance().call()
  const investTokenBalance = await pool.methods.investTokenBalance().call()
  const totalPortfolioValue = await pool.methods.totalPortfolioValue().call()
  const investedTokenValue = await pool.methods.investedTokenValue().call()

  return {
    deposits: await toNumber(usdcDecimals, deposits, 4),
    withdrawals: await toNumber(usdcDecimals, withdrawals, 4),
    depositTokenBalance: await toNumber(usdcDecimals, depositTokenBalance, 4),
    investTokenBalance:  await toNumber(wethDecimals, investTokenBalance, 4),
    totalPortfolioValue: await toNumber(usdcDecimals, totalPortfolioValue, 4),
    investedTokenValue: await toNumber(usdcDecimals, investedTokenValue, 4),
    
    depositTokenSymbol: usdcSymbol,
    investTokenSymbol: wethSymbol,
  }
}


export const getPortfolioInfo = async () => {

    const account = await getAccount()
    const pool = await getInstance()
    const usdc = await getInstanceUSDC()

    const decimals = await usdc.methods.decimals().call()
  
    const portfolioValue = await pool.methods.portfolioValue(account).call()
    const deposited = await pool.methods.getDeposits().call({ from: account })
    const withdrawn = await pool.methods.getWithdrawals().call({ from: account})

    return {
        deposited: await toNumber(decimals, deposited, 4),
        withdrawn: await toNumber(decimals, withdrawn, 4),
        portfolioValue: await toNumber(decimals, portfolioValue, 4),
        depositTokenSymbol: await usdc.methods.symbol().call(),
    }
}



export const deposit = async (amount) => {
    const pool = await getInstance()
    const usdcp = await getInstanceUSDC()
    const account = await getAccount()
    const decimals = await usdcp.methods.decimals().call()
    const tokenDecimals = await toTokenDecimals(decimals, amount)
  
    return new Promise((resolve, reject) => {
      pool.methods.deposit(tokenDecimals)
        .send({
            from: account,
            gasPrice: '50000000000'
        }).once("receipt", (receipt) => {
          console.log("deposit receipt >> ", receipt);
          resolve(receipt) 
        }).catch((err) => {
          console.log("deposit error:", err);
          reject(err)
        });
      })
        
    return response
}

export const withdraw = async (amount) => {
    const pool = await getInstance()
    const usdcp = await getInstanceUSDC()
    const account = await getAccount()
    const decimals = await usdcp.methods.decimals().call()
    const tokenDecimals = await toTokenDecimals(decimals, amount)
  
    return new Promise((resolve, reject) => {
      pool.methods.withdraw(tokenDecimals)
        .send({
            from: account,
            gasPrice: '50000000000'
        }).once("receipt", (receipt) => {
          console.log("approve receipt >> ", receipt);
          resolve(receipt)
        }).catch((err) => {
          console.log("withdraw error:", err);
          reject(err)
        });
      })
}


const abi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_uniswapV2RouterAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_priceFeedAddress",
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
          "internalType": "address",
          "name": "_lpTokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_strategyAddress",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_updateInterval",
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
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "depositLP",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "totalPortfolioLP",
          "type": "uint256"
        }
      ],
      "name": "Deposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Deposited",
      "type": "event"
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
          "name": "slippage",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "thereshold",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountMin",
          "type": "uint256"
        }
      ],
      "name": "SlippageInfo",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "strategyAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        }
      ],
      "name": "StrategyChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "swapType",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "spent",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "bought",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "slippage",
          "type": "uint256"
        }
      ],
      "name": "Swapped",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amountWithdrawn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "lpWithdrawn",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "lpRemaining",
          "type": "uint256"
        }
      ],
      "name": "Withdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "Withdrawn",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "name": "checkUpkeep",
      "outputs": [
        {
          "internalType": "bool",
          "name": "upkeepNeeded",
          "type": "bool"
        },
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "deposit",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        
      ],
      "name": "depositTokenBalance",
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
      "name": "depositTokenValue",
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
          "name": "",
          "type": "address"
        }
      ],
      "name": "deposits",
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
      "name": "getDeposits",
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
      "name": "getWithdrawals",
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
      "name": "interval",
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
      "name": "invest",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        
      ],
      "name": "investTokenBalance",
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
      "name": "investedTokenValue",
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
      "name": "lastTimeStamp",
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
      "name": "latestFeedPrice",
      "outputs": [
        {
          "internalType": "int256",
          "name": "",
          "type": "int256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        
      ],
      "name": "latestFeedTimestamp",
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
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "name": "performUpkeep",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        
      ],
      "name": "performUpkeepCounter",
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
          "name": "_addr",
          "type": "address"
        }
      ],
      "name": "portfolioPercentage",
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
          "name": "_addr",
          "type": "address"
        }
      ],
      "name": "portfolioValue",
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
          "name": "_slippage",
          "type": "uint256"
        }
      ],
      "name": "setSlippageThereshold",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_strategyAddress",
          "type": "address"
        }
      ],
      "name": "setStrategy",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "tokenIn",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "tokenOut",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amountIn",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amountMin",
          "type": "uint256"
        }
      ],
      "name": "slippagePercentage",
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
      "name": "slippageThereshold",
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
      "name": "totalDeposited",
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
      "name": "totalPortfolioValue",
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
      "name": "totalWithdrawn",
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
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        }
      ],
      "name": "withdraw",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        
      ],
      "name": "withdrawAll",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "lpAmount",
          "type": "uint256"
        }
      ],
      "name": "withdrawLP",
      "outputs": [
        
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "withdrawals",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]