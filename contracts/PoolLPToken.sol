pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MinterRole.sol";

// interface ILPToken {
//     function mint(address to, uint256 value) external returns (bool);
//     function burn(address to, uint256 value) external returns (bool);
//     function balanceOf(address account) external view returns (uint256);
// }

contract PoolLPToken is ERC20, MinterRole {

    constructor () public ERC20("Pool LP Token", "PoolLP") {}

    function mint(address to, uint256 value) public onlyMinter returns (bool) {
        _mint(to, value);
        return true;
    }

    function burn(address to, uint256 value) public onlyMinter returns (bool) {
        _burn(to, value);
        return true;
    }

}

