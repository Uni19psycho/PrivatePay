// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.20;

import {FHE, euint64, ebool, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

contract FHEPrivateWallet {
    mapping(address => euint64) private _balances;

    event Deposited(address indexed user, euint64 newBalance);
    event PrivatePaymentPlanned(address indexed from, address indexed to, euint64 encryptedAmount);
    event Withdrawn(address indexed user, address indexed cashier, euint64 encryptedAmount);

    function getMyEncryptedBalance() external view returns (euint64) {
        return _balances[msg.sender];
    }

    function getEncryptedBalance(address user) external view returns (euint64) {
        return _balances[user];
    }

    function deposit(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 newBalance = FHE.add(_balances[msg.sender], amount);
        _balances[msg.sender] = newBalance;

        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);

        emit Deposited(msg.sender, newBalance);
    }

    function privatePay(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        ebool hasEnough = FHE.le(amount, _balances[msg.sender]);
        euint64 zero = FHE.asEuint64(0);
        euint64 debited = FHE.select(hasEnough, amount, zero);

        euint64 newBalance = FHE.sub(_balances[msg.sender], debited);
        _balances[msg.sender] = newBalance;

        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);

        emit PrivatePaymentPlanned(msg.sender, to, amount);
    }

    function withdrawToCashier(
        address cashier,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        ebool hasEnough = FHE.le(amount, _balances[msg.sender]);
        euint64 zero = FHE.asEuint64(0);
        euint64 debited = FHE.select(hasEnough, amount, zero);

        euint64 newBalance = FHE.sub(_balances[msg.sender], debited);
        _balances[msg.sender] = newBalance;

        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);
        FHE.allow(amount, cashier);
        FHE.allow(amount, msg.sender);

        emit Withdrawn(msg.sender, cashier, amount);
    }
}
