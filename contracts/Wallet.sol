// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable {

    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);

    uint public totalDeposited = 0;
    uint public totalWithdrawn = 0;

    mapping (address => uint) public deposits;
    mapping (address => uint) public withdrawals;

    address[] public users;
    mapping (address => bool) usersMap;


    IERC20Metadata immutable public depositToken;

    constructor(address _depositTokenAddress) {
        depositToken = IERC20Metadata(_depositTokenAddress);
    }


    function getUsers() public view returns (address[] memory) {
        return users;
    }


    function deposit(uint amount) public virtual {
        require(amount > 0, "Deposit amount is 0");
        require(depositToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance to deposit");

        deposits[msg.sender] += amount;
        totalDeposited += amount;
        // remember addresses that deposited tokens
        if (!usersMap[msg.sender]) {
            usersMap[msg.sender] = true;
            users.push(msg.sender);
        }
        depositToken.transferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount);
    }


    function withdraw(uint amount) internal virtual {
        require(amount > 0, "Withdraw amount is 0");
        require(depositToken.balanceOf(address(this)) >= amount, "Withdrawal amount exceeds balance");

        withdrawals[msg.sender] += amount;
        totalWithdrawn += amount;

        depositToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }
}