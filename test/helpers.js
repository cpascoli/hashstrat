round = (n, d=2) => {
    return Math.round(n * (10**d)) / (10**d)
}

fromWei = (v) => {
    return web3.utils.fromWei(v , 'ether')
}

toWei = (v) => {
    return web3.utils.toWei(v , 'ether')
}

module.exports = {
    round,
    fromWei,
    toWei
  };

