import Web3 from "web3"
import { toNumber, getAccount, toTokenDecimals } from '../utils'
import { contract_address as pool_conctract_address } from './pool'


/// PoolLP contract on Kovan
export const contract_address = '0xD9E6A74D970B67C0c25b03D96cf4f9f4040C4D0a';


export const getInterface = () => {
    return {
        getBalance: () => getBalance(),
        getAllowance: () => getAllowance(),
        approve: (amount) => approve(amount),
        symbol: () => symbol(),
    }
}


export const getInstance = async () => {
    const web3 = new Web3(window.ethereum);
    // var web3 = new Web3(web3.currentProvider);

    return new web3.eth.Contract(abi, contract_address)
}


export const getBalance = async () => {
    const account = await getAccount()
    const poolLP = await getInstance()
    const decimals = await poolLP.methods.decimals().call()
    const balance = await poolLP.methods.balanceOf(account).call()

    return {
        balance: balance.toString(),
        units: await toNumber(decimals, balance, 2)
    }
}


export const getAllowance = async () => {
    const account = await getAccount()
    const poolLP = await getInstance()
    const decimals = await poolLP.methods.decimals().call()
    const allowance = await poolLP.methods.allowance(account, pool_conctract_address).call()
    const allowanceDec = await toNumber(decimals, allowance, 2)

    return Number(allowanceDec.toString())
}


export const approve = async (amount) => {

    const account = await getAccount()
    const poolLP = await getInstance()
    const decimals = await poolLP.methods.decimals().call()
    const tokenDecimals = await toTokenDecimals(decimals, amount)
  
    return new Promise((resolve, reject) => {
            poolLP.methods.approve(pool_conctract_address, tokenDecimals ).send({
            from: account,
            gasPrice: '50000000000'
        }).once("receipt", (receipt) => {
            console.log("approve receipt >> ", receipt);
            resolve(receipt)
        }).catch((err) => {
            console.log("approve error:", err);
            reject(err)
        });
    })

}
  
  
export const symbol = async() => {
    const poolLP = await getInstance()
    const response = await poolLP.methods.symbol().call()
    return response
}

  

const abi = [
  {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [
          {
              "name": "",
              "type": "string"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_spender",
              "type": "address"
          },
          {
              "name": "_value",
              "type": "uint256"
          }
      ],
      "name": "approve",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_from",
              "type": "address"
          },
          {
              "name": "_to",
              "type": "address"
          },
          {
              "name": "_value",
              "type": "uint256"
          }
      ],
      "name": "transferFrom",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "decimals",
      "outputs": [
          {
              "name": "",
              "type": "uint8"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [
          {
              "name": "_owner",
              "type": "address"
          }
      ],
      "name": "balanceOf",
      "outputs": [
          {
              "name": "balance",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [
          {
              "name": "",
              "type": "string"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_to",
              "type": "address"
          },
          {
              "name": "_value",
              "type": "uint256"
          }
      ],
      "name": "transfer",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [
          {
              "name": "_owner",
              "type": "address"
          },
          {
              "name": "_spender",
              "type": "address"
          }
      ],
      "name": "allowance",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "name": "owner",
              "type": "address"
          },
          {
              "indexed": true,
              "name": "spender",
              "type": "address"
          },
          {
              "indexed": false,
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Approval",
      "type": "event"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "name": "from",
              "type": "address"
          },
          {
              "indexed": true,
              "name": "to",
              "type": "address"
          },
          {
              "indexed": false,
              "name": "value",
              "type": "uint256"
          }
      ],
      "name": "Transfer",
      "type": "event"
  }
]

