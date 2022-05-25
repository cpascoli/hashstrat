# hashstrat

A Pool contract that implements a simple crypto investment fund.

Users depoist DAI into the pool and receive PoolLP tokens back that represent their share in the pool.
New PoolLP tokens get minted when DAI are deposited into the pool and get burt when DAI are withdrawn from the pool.
The Pool can spend some of its DAI to buy WETH on UniswapV2, or can sell some WETH for DAI.
The Pool uses a rebalancing strategy to target a 60% / 40% split allocation of WETH and DAI.
This means that the value of WETH (in DAI) aims to be about 60% of the overall value of the Pool (in DAI).
The strategy waits for the value of WETH in the Pool to go above/below the 60% target by a preset thereshold (e.g 15%) before rebalancing.
The Pool uses Chainlink keepers to automate the Pool rebalaning operations.
The price of WETH/USD is also provided by a Chainlink feed.

NOTE: Deployment scripts can deploy to Kovan only.



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


### Deploy (Kovan)

```bash
npm run migrate:kovan:
```


### Verify contracts (Kovan)

```bash
npm run verify
```
