const HDWalletProvider = require('@truffle/hdwallet-provider')
require('dotenv').config()

const mnemonic = process.env.MNEMONIC
const url_polygon_main = process.env.RPC_URL_POLYGON_MAIN
const url_polygon_test = process.env.RPC_URL_POLYGON_TEST
const url_kovan = process.env.RPC_URL_KOVAN

const etherscan_api_key = process.env.ETHERSCAN_API_KEY
const polygonscan_api_key = process.env.POLYGONSCAN_API_KEY
const bscscan_api_key = process.env.BSSCAN_API_KEY

module.exports = {
  networks: {
    develop: {
      host: '127.0.0.1',
      port: 9545,
      network_id: 1337,
      accounts: 5,
      defaultEtherBalance: 500,
      blockTime: 3
    },
    cldev: {
      host: '127.0.0.1',
      port: 9545,
      network_id: 1337,
    },
    ganache: {
      host: '127.0.0.1',
      port: 7545,
      network_id: '*',
    },
    binance_testnet: {
      provider: () => new HDWalletProvider(mnemonic,'https://data-seed-prebsc-1-s1.binance.org:8545'),
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    matic_testnet: {
      provider: () => new HDWalletProvider(mnemonic, url_polygon_test),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    kovan: {
      provider: () => new HDWalletProvider(mnemonic, url_kovan),
      network_id: '42',
      gas: 8000000,
      networkCheckTimeout: 300000,
      timeoutBlocks: 50,
      skipDryRun: true
    },
    matic: {
      provider: () => new HDWalletProvider(mnemonic, url_polygon_main),
      network_id: 137,
      confirmations: 0,
      timeoutBlocks: 50,
      networkCheckTimeout:60000,
      gasPrice: 50000000000,
      skipDryRun: false,
    },
  },
  compilers: {
    solc: {
      version: '0.6.6',
    },
  },
  plugins: ['truffle-plugin-verify'],
  api_keys: {
    etherscan: etherscan_api_key,
    polygonscan: polygonscan_api_key,
    bscscan: bscscan_api_key,
  }
}
