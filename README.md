# FHE Private Wallet – Logic Prototype on Zama FHEVM (Sepolia)

This repo is a logic build for a private payment wallet on Zama FHEVM Sepolia.

Balances and payment amounts are stored as encrypted `euint64` values inside
`FHEPrivateWallet`, while decryption happens offchain through the Zama relayer
SDK and FHEVM client library.

The current flow covers:

- Encrypted balances per address
- Encrypted deposits
- Encrypted private payments (`privatePay`) that debit the encrypted balance
- A simple withdrawal pattern that sends a private payment to a fixed cashier
- A CLI script that runs the full encrypted flow against the deployed contract
- A Telegram bot that exposes `/balance`, `/deposit`, `/pay`, and `/withdraw`

All of this has been tested end-to-end against the FHEVM Sepolia testnet with
the official Hardhat template and relayer SDK.

---

## 1. Deployments

**Network:** Sepolia (Zama FHEVM RPC + relayer)

- `FHEPrivateWallet`  
  Address: `0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0`

- `UsdFheToken` (plain ERC-20 used as a test stablecoin)  
  Address: `0x15Bf4B782Ac42d5EB7fBd3aEbb9736b4e2C625bd`  
  Note: transfers of `usdFHE` are not encrypted; it behaves like a normal ERC-20.
  The encrypted ledger currently lives only inside `FHEPrivateWallet`.

**Key actors**

- Signer / demo account: `0x303d219C7e04D6872b0dc784D074078e94D78342`
- Cashier (withdrawal target): `0x5d8668cADB497D62d62C1FF8AFF801E8151E849F`

---

## 2. Environment variables

### 2.1 Root `.env` (project root)

Used by Hardhat and the CLI test `Test.mjs`:

```bash
SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/<INFURA_KEY>"
PRIVATE_KEY=0x<PRIVATE_KEY_OF_SIGNER>
CONTRACT_ADDRESS=0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0
CASHIER_ADDRESS=0x5d8668cADB497D62d62C1FF8AFF801E8151E849F
# USD_FHE_ADDRESS=0x15Bf4B782Ac42d5EB7fBd3aEbb9736b4e2C625bd
