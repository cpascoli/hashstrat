// name: USDCP Token
// symbol: USDCP

// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCP is ERC20 {

    constructor(uint256 initialSupply) ERC20("USDCP Token", "USDCP") public {
        _mint(msg.sender, initialSupply);
        _setupDecimals(6);
    }
}