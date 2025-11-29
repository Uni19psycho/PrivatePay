import dotenv from "dotenv";
import { ethers } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import fs from "fs";

dotenv.config();

const {
  SEPOLIA_RPC_URL,
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  CASHIER_ADDRESS,
} = process.env;

if (!SEPOLIA_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !CASHIER_ADDRESS) {
  throw new Error(
    "Missing one or more env vars: SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, CASHIER_ADDRESS"
  );
}

const artifact = JSON.parse(
  fs.readFileSync(
    "./artifacts/contracts/FHEPrivateWallet.sol/FHEPrivateWallet.json",
    "utf8"
  )
);
const abi = artifact.abi;

async function decryptBalance(fhe, wallet, encBalance) {
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

  const clearMap = await fhe.userDecrypt(
    handles,
    privateKey,
    publicKey,
    signature,
    [CONTRACT_ADDRESS],
    wallet.address,
    startTimestamp,
    durationDays
  );

  const values = Object.values(clearMap);
  if (values.length === 0) return 0n;

  return values[0];
}

async function main() {
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
  const fhe = await createInstance(SepoliaConfig);

  console.log("Signer:", wallet.address);
  console.log("Wallet contract:", CONTRACT_ADDRESS);
  console.log("Cashier:", CASHIER_ADDRESS);

  let enc = await contract.getMyEncryptedBalance();
  let bal = await decryptBalance(fhe, wallet, enc);
  console.log("Initial decrypted balance:", bal.toString());

  const depositAmount = 50n;
  const input1 = fhe.createEncryptedInput(CONTRACT_ADDRESS, wallet.address);
  input1.add64(depositAmount);
  const encrypted1 = await input1.encrypt();
  const tx1 = await contract.deposit(
    encrypted1.handles[0],
    encrypted1.inputProof
  );
  const r1 = await tx1.wait();
  console.log("Deposit tx:", r1.hash);

  enc = await contract.getMyEncryptedBalance();
  bal = await decryptBalance(fhe, wallet, enc);
  console.log("Balance after deposit:", bal.toString());

  const withdrawAmount = 20n;
  const input2 = fhe.createEncryptedInput(CONTRACT_ADDRESS, wallet.address);
  input2.add64(withdrawAmount);
  const encrypted2 = await input2.encrypt();
  const tx2 = await contract.privatePay(
    CASHIER_ADDRESS,
    encrypted2.handles[0],
    encrypted2.inputProof
  );
  const r2 = await tx2.wait();
  console.log("Withdraw tx (to cashier):", r2.hash);

  enc = await contract.getMyEncryptedBalance();
  bal = await decryptBalance(fhe, wallet, enc);
  console.log("Final decrypted balance:", bal.toString());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
