import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { createFheWallet } from "./fheWalletClient.mjs";

const { SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error("Missing SEPOLIA_RPC_URL, PRIVATE_KEY or CONTRACT_ADDRESS");
  process.exit(1);
}

const artifactPath = path.resolve(
  new URL("../artifacts/contracts/FHEPrivateWallet.sol/FHEPrivateWallet.json", import.meta.url).pathname
);
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const wallet = await createFheWallet({
    signer,
    contractAddress: CONTRACT_ADDRESS,
    abi,
  });

  console.log("Wallet account:", wallet.account);

  const initial = await wallet.getBalance();
  console.log("Initial balance:", initial.toString());

  await wallet.deposit(50n);
  console.log("Deposited 50");

  await wallet.privatePay(wallet.account, 20n);
  console.log("Private paid 20 to self");

  const finalBalance = await wallet.getBalance();
  console.log("Final balance:", finalBalance.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
