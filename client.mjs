import { ethers } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import fs from "fs";

const RPC_URL = process.env.SEPOLIA_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0";

const artifact = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/FHEPrivateWallet.sol/FHEPrivateWallet.json",
    "utf8"
  )
);
const abi = artifact.abi;

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Using wallet:", wallet.address);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  // 1) SDK instance for Sepolia
  const fhe = await createInstance(SepoliaConfig);

  // 2) amount to deposit
  const clearAmount = 100n;

  // 3) Create encrypted input for deposit(...)
  const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, wallet.address);
  input.add64(clearAmount);

  const encrypted = await input.encrypt();
  console.log("Encrypted payload:", encrypted);

  // 4) Call deposit(externalEuint64, bytes)
  const tx = await contract.deposit(
    encrypted.handles[0],
    encrypted.inputProof
  );
  const receipt = await tx.wait();
  console.log("Deposit mined in block:", receipt.blockNumber);

  // 5) Read encrypted balance
  const encBalance = await contract.getMyEncryptedBalance();
  console.log("Encrypted balance:", encBalance);

  // 6) Prepare user-only decryption

  // 6a) Generate an FHE keypair for this user session
  const { publicKey, privateKey } = fhe.generateKeypair();

  // 6b) Build EIP712 typed data the wallet will sign
  const startTimestamp = Math.floor(Date.now() / 1000); // now (sec)
  const durationDays = 1; // 1 day delegation window

  const eip712 = fhe.createEIP712(
    publicKey,
    [CONTRACT_ADDRESS],
    startTimestamp,
    durationDays
  );

  // ethers v6: signTypedData(domain, types, message)
  const { domain, types, message } = eip712;

  // Remove EIP712Domain from types for ethers v6
  const { EIP712Domain, ...typesWithoutDomain } = types;

  const signature = await wallet.signTypedData(
    domain,
    typesWithoutDomain,
    message
  );

  // 6c) Build handles array for userDecrypt
  const handles = [
    {
      handle: encBalance,              // encrypted value from the contract
      contractAddress: CONTRACT_ADDRESS
    }
  ];

  // 7) Call userDecrypt to get user-only clear values
  const userResults = await fhe.userDecrypt(
    handles,
    privateKey,
    publicKey,
    signature,
    [CONTRACT_ADDRESS],
    wallet.address,
    startTimestamp,
    durationDays
  );

  console.log("UserDecrypt results:", userResults);

  // 8) Pick the first decrypted value from ClearValues map (for inspection)
  const keys = Object.keys(userResults);
  if (keys.length > 0) {
    const firstKey = keys[0];
    const valueEntry = userResults[firstKey];
    console.log("First decrypted entry:", valueEntry);
  } else {
    console.log("No decrypted values returned");
  }
}

// ✅ close main() BEFORE calling it
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
