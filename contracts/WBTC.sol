// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WBTC is ERC20 {

    constructor(uint256 initialSupply) ERC20("WBTC Token", "WBTC") {
        _mint(msg.sender, initialSupply);
    }

    function decimals() public pure override returns (uint8) {
        return 8;
    }
}