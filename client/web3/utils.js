import { myWeb3, eth } from './provider'

// from int to string
export const toTokenDecimals = async (decimals, amount) => {
    
    const digits =  myWeb3.utils.toBN('10').pow( myWeb3.utils.toBN(decimals) ); 
    const factor = myWeb3.utils.toBN(10000)
    const tokenDecimals = myWeb3.utils.toBN( Math.floor(amount * 10000) ).mul(digits).div(factor).toString()
    return tokenDecimals
}

// from string to int 
export const toTokenUnits = async (decimals, amount) => {
    const digits =  myWeb3.utils.toBN('10').pow( myWeb3.utils.toBN(decimals) ); 
    const unitsString = myWeb3.utils.toBN(amount).div(digits).toString()
    const units = parseInt(unitsString)
    
    return units
}

// from string to number with 'precision' decimals
export const toNumber = async (decimals, amount, precision) => {
    const digits =  myWeb3.utils.toBN('10').pow( myWeb3.utils.toBN(decimals) ); 
    const extra =  myWeb3.utils.toBN('10').pow(myWeb3.utils.toBN(precision)); 
    const number = myWeb3.utils.toBN(amount).mul(extra).div(digits).toNumber()
    const decimal = number / extra.toNumber()
    
    return decimal
}

export const shortenAccount = (account) => {
    return account.substring(0, 6) + "..." + account.substring(38)
}

export const getAccount = async () => {
    const accounts = await eth.getAccounts()
    if (accounts.length == 0) {
        console.log("getAccount() - No account found", accounts)
        throw Error("No account found! Please connect a wallet and try again!")
    }
    return accounts[0]
}


export const getBlock = () => {
    return Promise.resolve(myWeb3.eth.getBlock('latest'));
}


export const convertHMS = (value) => {
    const sec = parseInt(value, 10);
    let hours   = Math.floor(sec / 3600); 
    let minutes = Math.floor((sec - (hours * 3600)) / 60);
    let seconds = sec - (hours * 3600) - (minutes * 60);
   
    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}

    return hours+'h '+minutes+'m '+seconds+'s';
}

export const isKovan = () => {
    return process.env.NEXT_PUBLIC_NETWORK == 'KOVAN'
}

export const isPolygon = () => {
    return process.env.NEXT_PUBLIC_NETWORK == 'POLYGON'
}

export const isLocal = () => {
    return process.env.NEXT_PUBLIC_NETWORK == 'LOCAL'
}


export const networkInfo = () => {

    const info = { }

    return new Promise((resolve, reject) => {

        myWeb3.eth.net.getId().then( id => {
            info.networkId = id
            info.networkName = networkName(id) 
            return myWeb3.eth.getBlockNumber()
            
        }).then( blockNumber => {
            return myWeb3.eth.getBlock(blockNumber)

        }).then( block => {
            info.blockNumber = block.number
            info.blockTimestamp = block.timestamp
            resolve(info)
        }).catch((err) => {
            console.log("blockInfo error:", err);
            reject(err)
        })
    })
 
}


export const networkName = (networkId) => {
    //console.log("networkName >>> ", networkId, "name", name)

    let name;
    switch (networkId) {
        case 1: { name = "Ethereum (Mainnet)"; break; }
        case 4: { name = "Rinkeby (Testnet)"; break; }
        case 42: { name = "Kovan (Testnet)"; break; }
        case 137: { name = "Polygon (Mainnet)"; break; }
        case 1337: { name = "Local"; break; }
        default: name = "Unknown"
    }
    console.log("networkName >>> ", networkId, "name", name)

    return name;
}


export const isSupportedNetwork = (networkId) => {

    return networkId == 42 || networkId == 137 || networkId == 1337
}