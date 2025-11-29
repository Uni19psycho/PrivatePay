// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title usdFHE test stablecoin
contract UsdFheToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("usdFHE Stablecoin", "usdFHE") {
        _mint(msg.sender, initialSupply);
    }

    /// @notice Uses 6 decimals.
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
