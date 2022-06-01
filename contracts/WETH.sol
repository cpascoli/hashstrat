// name: WETH Token
// symbol: WETH

// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {

    constructor(uint256 initialSupply) ERC20("WETH Token", "WETH") public {
        _mint(msg.sender, initialSupply);
        _setupDecimals(18);
    }
}