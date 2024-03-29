# HashStrat - Solidity Contracts

This repo contains the suite of Solidity smart contracts for HashStrat Pools and Strategies.

HashStrat Pools hold a risk asset (e.g WETH or WBTC) and a stable asset (e.g USDC or DAI).
Each Pool comes with a Strategy that is able to trade between the risk asset and the stable asset held in the Pool.
Users can deposit stable assets into a Pool and let the strategies take care of the rest.

Strategies use [Chainlink data feeds](https://docs.chain.link/docs/matic-addresses/) to assist their trading logic.
[Chainlink Keepers](https://docs.chain.link/docs/chainlink-keepers/introduction/) are used automate the strategy execution.

 So far there are 3 strategies:
 - RebalancingV1: Ensures to rebalance the assets in the Pool when their value moves above or below predetermined levels of the overall value of the Pool.
 - MeanReversionV1: buys over a period of time when the price of the risk asset is way below a long term moving average and sells over a perio dof time, when it's way above.
 - TrendFollowV1: Allocates to the risk asset when its price moves above a short term moving average and sells when it moves below.
 

# Associated Repos 

- [Frontend](https://github.com/cpascoli/hashstrat-frontend) - The ReactJS frontend deployed at [https://hashstrat.com/](https://hashstrat.com/)
- [Indexes](https://github.com/cpascoli/hashstrat-indexes) - Smart contracts for HashStrat Indexes
- [Governance](https://github.com/cpascoli/hashstrat-governance) - Smart contracts for the HashStrat DAO Token (HST), HST Farming Pool, etc.



# Instructions

### Requirements

1. NodeJS (v18.0.0) 

2. Install truffle

```bash
npm install truffle -g
```

3. Install dependencies by running:

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


### Run Tests

```bash
npm run test
```


### Deploy Contracts

Kovan:
```bash
npm run migrate:kovan
npm run migrate:kovan:reset
```

Polygon:
```bash
npm run migrate:matic
npm run migrate:matic:reset
```


### Verify Contracts

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





