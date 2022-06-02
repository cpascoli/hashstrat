# HashStrat

A NextJS app and associated Solidity Smart Contracts implementing a simple crypto investment fund.


This is the functionality implemented so far:
- Users depoist DAI into the pool and receive PoolLP tokens back that represent their share in the pool.
- New PoolLP tokens get minted when DAI are deposited into the pool and get burt when DAI are withdrawn from the pool.
- The Pool can spend some of its DAI to buy WETH on UniswapV2, or can sell some WETH for DAI.
- The Pool uses a rebalancing strategy to target a 60% / 40% split allocation of WETH and DAI. This means that the value of WETH (in DAI) aims to be about 60% of the overall value of the Pool (in DAI).
- The strategy waits for the value of WETH in the Pool to go above/below the 60% target by a preset thereshold (e.g 15%) before rebalancing.
- The Pool uses Chainlink keepers to automate the Pool rebalaning operations.
- The price of WETH/USD is also provided by a Chainlink feed. This price feed is used to determine the value of the WETH in the fund and to trigger the rebalance process.

NOTE: Deployment scripts can deploy to Kovan and Poligon (Mainnet).



### Requirements

- NodeJS (v18.0.0)


### Installation

1. Install truffle

```bash
npm install truffle -g
```

2. Install dependencies by running:

```bash
npm install

# OR...

yarn install
```


### Customize Environment vars:

Edit vars in `.env` file:

```bash
MNEMONIC="<12 memonic words here>"
RPC_URL="https://kovan.infura.io/v3/<infura_project_id here>"
ETHERSCAN_API_KEY="<etherscan api key here"
```

### Test

```bash
npm run test
```


### Deploy

Kovan:
```bash
npm run migrate:kovan
```

Polygon:
```bash
npm run migrate:matic
```


### Verify contracts

Kovan:
```bash
npm run verify:kovan
```

Polygon:
```bash
npm run verify:matic
```

## Query the user portfolio data (Kovan)

```bash
npm run portfolio-value:kovan
```

## HowTo use the Pool Contract (Kovan)

1. Approve Pool contract address to spend DAI 
- call `approve` function on [DAI contract](https://kovan.etherscan.io/address/0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa#writeContract)

2. Deposit DAI into the pool:
- call `deposit` function on [Pool contract](https://kovan.etherscan.io/address/0x1d97C5B5241C7E9a6bDFf2faC5b6EA95B33E1275#writeContract)

3. Add PoolLP token info into Metamask (e.g use PoolLP contract address `0xCA9097759A8Fc3409e170c5e20Fc2e873A629b65`)

4. Wait for [Chainlink Keeper](https://keepers.chain.link/kovan/3387) to trigger a portfolio rebalance 
 - alternatively you can call the `invest` function on the [Pool contract](https://kovan.etherscan.io/address/0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa#writeContract)
 
 Execution of the `invest` function on the Pool contract can trigger a rebalance operation (aka a swap between DAI and WETH or viceversa) as demostrated in [this transaction](https://kovan.etherscan.io/tx/0x7cd5b8f334d48121713d6fe11280e164a78fafee0909648dd9254482d8e02a0f).


## HowTo use the Pool Contract (Polygon)

TODO


## Run Frontend (local)

Note: 



1. Start a local blockchain with Truffle: (port 9545)
```
truffle develop
```

2. Deploy contracts to local blockchain:
```
truffle migrate --network develop
```

3. Start local webserver
```
npm run dev
```

4. Use The Dapp
- Access the React frontend at [http://localhost:3000/](http://localhost:3000/)
- Connect Metamask to the local blockchain at http://127.0.0.1:9545/
- Import owner Account with private key: `6077412bec90b79698977fa6152d4b62fcc71cef932ec06f469ad6904e7c782c`




