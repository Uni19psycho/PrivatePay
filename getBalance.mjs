import "dotenv/config";
import { ethers } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import fs from "fs";

const { SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error("Missing SEPOLIA_RPC_URL, PRIVATE_KEY or CONTRACT_ADDRESS");
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/FHEPrivateWallet.sol/FHEPrivateWallet.json",
    "utf8"
  )
);
const abi = artifact.abi;

async function decryptBalance(provider, wallet) {
  const fhe = await createInstance(SepoliaConfig);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  const encBalance = await contract.getMyEncryptedBalance();

  const { publicKey, privateKey } = fhe.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;

  const eip712 = fhe.createEIP712(
    publicKey,
    [CONTRACT_ADDRESS],
    startTimestamp,
    durationDays
  );

  const { domain, types, message } = eip712;
  const { EIP712Domain, ...typesWithoutDomain } = types;

  const signature = await wallet.signTypedData(
    domain,
    typesWithoutDomain,
    message
  );

  const handles = [
    {
      handle: encBalance,
      contractAddress: CONTRACT_ADDRESS,
    },
  ];

  const results = await fhe.userDecrypt(
    handles,
    privateKey,
    publicKey,
    signature,
    [CONTRACT_ADDRESS],
    wallet.address,
    startTimestamp,
    durationDays
  );

  const values = Object.values(results);
  if (!values.length) return 0n;
  return values[0];
}

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Wallet:", wallet.address);

  const balance = await decryptBalance(provider, wallet);
  console.log("Decrypted balance:", balance.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
