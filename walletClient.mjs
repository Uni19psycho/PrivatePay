import { ethers } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import fs from "fs";

const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0";

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing SEPOLIA_RPC_URL or PRIVATE_KEY env vars");
}

const artifact = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/FHEPrivateWallet.sol/FHEPrivateWallet.json",
    "utf8"
  )
);
const abi = artifact.abi;

// shared init
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

let fheInstancePromise = null;
function getFhe() {
  if (!fheInstancePromise) {
    fheInstancePromise = createInstance(SepoliaConfig);
  }
  return fheInstancePromise;
}

// --- internal helper: decrypt current balance ---
async function decryptBalance(encBalance) {
  const fhe = await getFhe();

  // FHE keypair for this session
  const { publicKey, privateKey: fhePrivateKey } = fhe.generateKeypair();

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
      contractAddress: CONTRACT_ADDRESS
    }
  ];

  const userResults = await fhe.userDecrypt(
    handles,
    fhePrivateKey,
    publicKey,
    signature,
    [CONTRACT_ADDRESS],
    wallet.address,
    startTimestamp,
    durationDays
  );

  const values = Object.values(userResults);
  if (values.length === 0) return 0n;
  return values[0]; // bigint
}

// --- public API ---

export async function deposit(amount) {
  const fhe = await getFhe();
  const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, wallet.address);
  input.add64(BigInt(amount));

  const encrypted = await input.encrypt();

  const tx = await contract.deposit(
    encrypted.handles[0],
    encrypted.inputProof
  );
  const receipt = await tx.wait();
  return receipt;
}

export async function privatePay(to, amount) {
  const fhe = await getFhe();
  const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, wallet.address);
  input.add64(BigInt(amount));

  const encrypted = await input.encrypt();

  const tx = await contract.privatePay(
    to,
    encrypted.handles[0],
    encrypted.inputProof
  );
  const receipt = await tx.wait();
  return receipt;
}

export async function getBalance() {
  const encBalance = await contract.getMyEncryptedBalance();
  const clear = await decryptBalance(encBalance);
  return clear; // bigint
}

// small debug helper if you run this file directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const bal = await getBalance();
    console.log("Wallet:", wallet.address);
    console.log("Decrypted balance:", bal.toString());
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
