// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MinterRole.sol";

/**
 * The LP Token of the pool.
 * New tokens get minted by the Pool when users deposit into the pool
 * and get burt when users withdraw from the pool.
 * Only the Pool contract should be able to mint/burn these tokens.
 */

contract PoolLPToken is ERC20, MinterRole {

    constructor (string memory _name, string memory _symbol, uint8 _decimals) public ERC20(_name, _symbol) {
        _setupDecimals(_decimals);
    }

    function mint(address to, uint256 value) public onlyMinter returns (bool) {
        _mint(to, value);
        return true;
    }

    function burn(address to, uint256 value) public onlyMinter returns (bool) {
        _burn(to, value);
        return true;
    }

}

