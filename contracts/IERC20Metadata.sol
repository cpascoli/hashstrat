// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}