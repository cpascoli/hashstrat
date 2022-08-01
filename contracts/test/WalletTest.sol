// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "../Wallet.sol";

contract WalletTest is Wallet  {

    constructor(address _depositTokenAddressl) Wallet (_depositTokenAddressl) {}

    function withdrawTest(uint amount) public {
        super.withdraw(amount);
    }
}
