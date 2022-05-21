// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    IERC20 internal depositToken;

    uint public totalDeposited = 0;

    // depositToken token balances
    mapping (address => uint256) public balances;

    // users that deposited depositToken tokens into their balances
    address[] internal usersArray;
    mapping (address => bool) internal users;


    constructor(address _depositTokenAddress) public {
        depositToken = IERC20(_depositTokenAddress);
    }


    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }


    function deposit(uint256 amount) public virtual {
        require(amount > 0, "Deposit amount should not be 0");
        require(depositToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance!");

        balances[msg.sender] = balances[msg.sender] + amount;

        // remember addresses that deposited tokens
        if (!users[msg.sender]) {
            users[msg.sender] = true;
            usersArray.push(msg.sender);
        }
        
        depositToken.transferFrom(msg.sender, address(this), amount);

        totalDeposited = totalDeposited + amount;

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) public virtual {
        require(balances[msg.sender] >= amount, "Insufficient token balance");

        balances[msg.sender] = balances[msg.sender] - amount;
        depositToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }
}