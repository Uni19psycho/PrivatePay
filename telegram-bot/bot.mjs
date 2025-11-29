import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { ethers } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";
import fs from "fs";
import path from "path";

const {
  TELEGRAM_BOT_TOKEN,
  SEPOLIA_RPC_URL,
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  CASHIER_ADDRESS,
} = process.env;

if (!TELEGRAM_BOT_TOKEN || !SEPOLIA_RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !CASHIER_ADDRESS) {
  console.error("Missing one or more env vars: TELEGRAM_BOT_TOKEN, SEPOLIA_RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS, CASHIER_ADDRESS");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

const artifactPath = path.resolve(
  new URL("../artifacts/contracts/FHEPrivateWallet.sol/FHEPrivateWallet.json", import.meta.url).pathname
);
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

let fheInstancePromise = null;
function getFheInstance() {
  if (!fheInstancePromise) fheInstancePromise = createInstance(SepoliaConfig);
  return fheInstancePromise;
}

async function decryptBalance(enc) {
  const fhe = await getFheInstance();
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

  const signature = await signer.signTypedData(
    domain,
    typesWithoutDomain,
    message
  );

  const handles = [
    {
      handle: enc,
      contractAddress: CONTRACT_ADDRESS,
    },
  ];

  const results = await fhe.userDecrypt(
    handles,
    privateKey,
    publicKey,
    signature,
    [CONTRACT_ADDRESS],
    signer.address,
    startTimestamp,
    durationDays
  );

  const values = Object.values(results);
  if (!values.length) return 0n;
  return values[0];
}

async function getDecryptedBalance() {
  const enc = await contract.getMyEncryptedBalance();
  return decryptBalance(enc);
}

async function doDeposit(amount) {
  const fhe = await getFheInstance();
  const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, signer.address);
  input.add64(BigInt(amount));
  const encrypted = await input.encrypt();
  const tx = await contract.deposit(
    encrypted.handles[0],
    encrypted.inputProof
  );
  return tx.wait();
}

async function doPrivatePay(to, amount) {
  const fhe = await getFheInstance();
  const input = fhe.createEncryptedInput(CONTRACT_ADDRESS, signer.address);
  input.add64(BigInt(amount));
  const encrypted = await input.encrypt();
  const tx = await contract.privatePay(
    to,
    encrypted.handles[0],
    encrypted.inputProof
  );
  return tx.wait();
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    `FHE Private Wallet\n\nSigner: ${signer.address}`
  );
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  const m = await bot.sendMessage(chatId, "Decrypting balance...");
  try {
    const bal = await getDecryptedBalance();
    await bot.editMessageText(
      `Balance: ${bal.toString()}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  } catch (err) {
    await bot.editMessageText(
      `Balance error:\n${err.message}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  }
});

bot.onText(/\/deposit (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = match && match[1] ? match[1] : "0";
  const m = await bot.sendMessage(chatId, `Depositing ${amount}...`);
  try {
    const receipt = await doDeposit(amount);
    const bal = await getDecryptedBalance();
    await bot.editMessageText(
      `Deposit ok.\nTx: ${receipt.transactionHash}\nNew balance: ${bal.toString()}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  } catch (err) {
    await bot.editMessageText(
      `Deposit error:\n${err.message}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  }
});

bot.onText(/\/pay (\d+)\s+([0-9a-fA-Fx]+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = match && match[1] ? match[1] : "0";
  const to = match && match[2] ? match[2] : "";
  const m = await bot.sendMessage(chatId, `Paying ${amount} to ${to}...`);
  try {
    const receipt = await doPrivatePay(to, amount);
    const bal = await getDecryptedBalance();
    await bot.editMessageText(
      `Payment ok.\nTx: ${receipt.transactionHash}\nNew balance: ${bal.toString()}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  } catch (err) {
    await bot.editMessageText(
      `Payment error:\n${err.message}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  }
});

bot.onText(/\/withdraw (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const amount = match && match[1] ? match[1] : "0";
  const m = await bot.sendMessage(chatId, `Withdrawing ${amount} to cashier ${CASHIER_ADDRESS}...`);
  try {
    const receipt = await doPrivatePay(CASHIER_ADDRESS, amount);
    const bal = await getDecryptedBalance();
    await bot.editMessageText(
      `Withdraw request ok.\nTx: ${receipt.transactionHash}\nNew balance: ${bal.toString()}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  } catch (err) {
    await bot.editMessageText(
      `Withdraw error:\n${err.message}`,
      { chat_id: chatId, message_id: m.message_id }
    );
  }
});
