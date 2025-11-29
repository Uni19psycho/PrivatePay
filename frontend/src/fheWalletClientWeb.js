// src/fheWalletClientWeb.js
import { ethers } from "ethers";

/**
 * We lazy-load the Zama SDK with dynamic import so that any
 * mismatch in the /web entry doesn’t crash the app at load time.
 */

let fheInstancePromise = null;

async function getFheInstance() {
  if (!fheInstancePromise) {
    fheInstancePromise = (async () => {
      const mod = await import("@zama-fhe/relayer-sdk/web");

      const createInstance = mod.createInstance;
      const SepoliaConfig = mod.SepoliaConfig;

      if (!createInstance || !SepoliaConfig) {
        throw new Error(
          "Relayer SDK /web entry missing createInstance or SepoliaConfig"
        );
      }

      return await createInstance(SepoliaConfig);
    })();
  }
  return fheInstancePromise;
}

/**
 * signer: ethers v6 Signer (BrowserProvider.getSigner())
 * contractAddress: deployed FHEPrivateWallet
 * abi: FHEPrivateWallet ABI
 */
export async function createFheWallet({ signer, contractAddress, abi }) {
  const account = await signer.getAddress();
  const fhe = await getFheInstance();
  const contract = new ethers.Contract(contractAddress, abi, signer);

  async function decryptBalance(encBalance) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { publicKey, privateKey: fhePrivateKey } = fhe.generateKeypair();

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

        const userResults = await fhe.userDecrypt(
          handles,
          fhePrivateKey,
          publicKey,
          signature,
          [contractAddress],
          account,
          startTimestamp,
          durationDays
        );

        const values = Object.values(userResults);
        if (values.length === 0) return 0n;
        return values[0];
      } catch (err) {
        const cause = err.cause || {};
        const isRelayerError =
          cause.code === "RELAYER_FETCH_ERROR" &&
          cause.operation === "USER_DECRYPT";

        if (isRelayerError && attempt < maxAttempts) {
          console.warn(
            `Relayer USER_DECRYPT error (HTTP ${cause.status}), retry ${attempt}/${maxAttempts - 1}`
          );
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        if (isRelayerError) {
          const e = new Error(
            `FHE userDecrypt unavailable (HTTP ${cause.status}) at ${cause.url}`
          );
          e.code = "FHE_DECRYPT_UNAVAILABLE";
          e.details = cause;
          throw e;
        }

        throw err;
      }
    }
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
    const receipt = await tx.wait();
    return receipt;
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
    const receipt = await tx.wait();
    return receipt;
  }

  async function getBalance() {
    const encBalance = await contract.getMyEncryptedBalance();
    const clear = await decryptBalance(encBalance);
    return clear;
  }

  return {
    account,
    contract,
    deposit,
    privatePay,
    getBalance,
  };
}
