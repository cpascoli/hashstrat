round = (n, d=2) => {
    return Math.round(n * (10**d)) / (10**d)
}

fromWei = (v, d=18) => {
    if (d==18) return web3.utils.fromWei(v , 'ether')
    if (d==9) return web3.utils.fromWei(v , 'gwei')
    if (d==6) return web3.utils.fromWei(v , 'mwei')
}

toWei = (v, d=18) => {
    if (d==18) return web3.utils.toWei(v , 'ether')
    if (d==9) return web3.utils.toWei(v , 'gwei')
    if (d==6) return web3.utils.toWei(v , 'mwei')
}

fromUsdc = (v) => {
    return web3.utils.fromWei(v , 'mwei')
}

toUsdc = (v) => {
   return web3.utils.toWei(v , 'mwei')
}


module.exports = {
    round,
    fromWei,
    fromUsdc,
    toUsdc,
    toWei
  };

