// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {

    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);

    uint public totalDeposited = 0;
    uint public totalWithdrawn = 0;

    // depositToken token balances
    mapping (address => uint) public deposits;
    mapping (address => uint) public withdrawals;

    // users that deposited depositToken tokens into their balances
    address[] internal usersArray;
    mapping (address => bool) internal users;
    IERC20Metadata internal depositToken;

    constructor(address _depositTokenAddress) {
        depositToken = IERC20Metadata(_depositTokenAddress);
    }

    function deposit(uint amount) public virtual {
        require(amount > 0, "Deposit amount is 0");
        require(depositToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance to deposit");

        deposits[msg.sender] = deposits[msg.sender] + amount;
        totalDeposited = totalDeposited + amount;
        // remember addresses that deposited tokens
        if (!users[msg.sender]) {
            users[msg.sender] = true;
            usersArray.push(msg.sender);
        }
        depositToken.transferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint amount) public virtual {
        require(amount > 0, "Withdraw amount is 0");
        require(depositToken.balanceOf(address(this)) >= amount, "Withdrawal amount exceeds balance");

        withdrawals[msg.sender] = withdrawals[msg.sender] + amount;
        totalWithdrawn = totalWithdrawn + amount;

        depositToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }
}