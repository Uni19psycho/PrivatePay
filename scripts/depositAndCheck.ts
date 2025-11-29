import { ethers } from "hardhat";
import * as hre from "hardhat";

const WALLET_ADDR = "0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0"; // your FHEPrivateWallet

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address);

  // 1) Attach to your deployed wallet
  const wallet = await ethers.getContractAt("FHEPrivateWallet", WALLET_ADDR, signer);

  // 2) Create an encrypted input bound to (contract, user)
  //    hre.fhevm comes from @fhevm/hardhat-plugin and wraps the relayer for you.
  const encInput = hre.fhevm.createEncryptedInput(
    WALLET_ADDR,
    signer.address
  );

  // 3) Add a single u64 value to encrypt, e.g. 100
  //    (this matches the deposit(externalEuint64, bytes) signature)
  encInput.add64(100n);

  // 4) Finalize encryption → external value + proof
  const encrypted = await encInput.encrypt();

  console.log("Encrypted handles:", encrypted.handles);
  console.log("Input proof len:", encrypted.inputProof.length);

  // 5) Call deposit(encryptedAmount, inputProof)
  console.log("Sending deposit tx...");
  const tx = await wallet.deposit(
    encrypted.handles[0],   // externalEuint64
    encrypted.inputProof    // bytes
  );
  const receipt = await tx.wait();
  console.log("Deposit tx mined in block:", receipt.blockNumber);

  // 6) Read your encrypted balance
  const encBalance = await wallet.getMyEncryptedBalance();
  console.log("Encrypted balance handle:", encBalance);

  // 7) Ask plugin to decrypt it as an euint64 for this user
  const clear = await hre.fhevm.userDecryptEuint(
    // type for euint64, provided by plugin
    hre.fhevm.FhevmType.EUINT64,
    encBalance,
    WALLET_ADDR,
    signer
  );

  console.log(`Decrypted balance for ${signer.address}:`, clear.toString());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
