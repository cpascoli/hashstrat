const BN = require('bn.js');

round = (n, d=2) => {
    return Math.round(n * (10**d)) / (10**d)
}

fromWei = (v, d=18) => {
    if (d==18) return web3.utils.fromWei(v , 'ether')
    if (d==9) return web3.utils.fromWei(v , 'gwei')
    if (d==6) return web3.utils.fromWei(v , 'mwei')

    return v / new BN(10 ** d)
}

toWei = (v, d=18) => {
    if (d==18) return web3.utils.toWei(v , 'ether')
    if (d==9) return web3.utils.toWei(v , 'gwei')
    if (d==6) return web3.utils.toWei(v , 'mwei')

    return v * new BN(10 ** d)
}

fromUsdc = (v) => {
    return web3.utils.fromWei(v , 'mwei')
}

toUsdc = (v) => {
   return web3.utils.toWei(v , 'mwei')
}


const increaseTime = addSeconds => { 

    const packet = {
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [addSeconds],
      id: new Date().getTime()
    };
  
    return new Promise((resolve, reject) => {
      web3.currentProvider.send(packet, (err, res) => {
        if (err !== null) return reject(err);
        return resolve(res);
      });
    });
}

module.exports = {
    round,
    fromWei,
    fromUsdc,
    toUsdc,
    toWei,
    increaseTime
  };

