import { ethers } from "ethers";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";

export async function createFheWallet({ signer, contractAddress, abi }) {
  const account = await signer.getAddress();
  const fhe = await createInstance(SepoliaConfig);
  const contract = new ethers.Contract(contractAddress, abi, signer);

  async function decryptBalance(encBalance) {
    const { publicKey, privateKey } = fhe.generateKeypair();
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1;

    const eip712 = fhe.createEIP712(
      publicKey,
      [contractAddress],
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
        handle: encBalance,
        contractAddress,
      },
    ];

    const results = await fhe.userDecrypt(
      handles,
      privateKey,
      publicKey,
      signature,
      [contractAddress],
      account,
      startTimestamp,
      durationDays
    );

    const values = Object.values(results);
    if (!values.length) return 0n;
    return values[0];
  }

  async function deposit(amount) {
    const amt = BigInt(amount);
    const input = fhe.createEncryptedInput(contractAddress, account);
    input.add64(amt);
    const encrypted = await input.encrypt();
    const tx = await contract.deposit(
      encrypted.handles[0],
      encrypted.inputProof
    );
    return tx.wait();
  }

  async function privatePay(to, amount) {
    const amt = BigInt(amount);
    const input = fhe.createEncryptedInput(contractAddress, account);
    input.add64(amt);
    const encrypted = await input.encrypt();
    const tx = await contract.privatePay(
      to,
      encrypted.handles[0],
      encrypted.inputProof
    );
    return tx.wait();
  }

  async function getBalance() {
    const encBalance = await contract.getMyEncryptedBalance();
    return decryptBalance(encBalance);
  }

  return {
    account,
    contract,
    deposit,
    privatePay,
    getBalance,
  };
}
