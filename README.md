# FHE Private Wallet – Logic Prototype on Zama FHEVM (Sepolia)

This repo is a logic build for a private payment wallet on Zama FHEVM Sepolia.

Balances and payment amounts are stored as encrypted `euint64` values inside
`FHEPrivateWallet`, while decryption happens offchain via the Zama relayer SDK
and FHEVM client library.

The current flow covers:

- Encrypted balances per address
- Encrypted deposits
- Encrypted private payments (`privatePay`) that debit the encrypted balance
- A simple withdrawal pattern that routes payments to a fixed cashier address
- A CLI script that runs the full encrypted flow against the deployed contract
- A Telegram bot that exposes `/balance`, `/deposit`, `/pay`, and `/withdraw`

All of this has been tested end-to-end against the FHEVM Sepolia testnet using
the official Hardhat template and relayer SDK.

---

## 1. Deployments

**Network:** Sepolia (Zama FHEVM RPC + relayer)

### Contracts

- `FHEPrivateWallet`  
  Address: `0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0`

- `UsdFheToken` (plain ERC-20 used as a test stablecoin, symbol `usdFHE`)  
  Address: `0x15Bf4B782Ac42d5EB7fBd3aEbb9736b4e2C625bd`

> Note: transfers of `usdFHE` are **not** encrypted; it behaves like a normal
> ERC-20 token. The encrypted ledger (balances and amounts) lives only inside
> `FHEPrivateWallet`.

### Key actors

- Signer / demo account (FHE wallet owner)  
  `0x303d219C7e04D6872b0dc784D074078e94D78342`

- Cashier address (withdrawal target)  
  `0x5d8668cADB497D62d62C1FF8AFF801E8151E849F`

---

## 2. Environment

### 2.1 Requirements

- Node.js ≥ 18  
- npm  
- Git

Install dependencies once at the project root:

```bash
npm install
