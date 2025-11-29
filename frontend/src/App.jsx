// src/App.jsx
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, EXPECTED_CHAIN_ID } from "./config";
import FHEPrivateWalletArtifact from "./abi/FHEPrivateWallet.json";
import { createFheWallet } from "./fheWalletClientWeb";

const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export default function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [chainOk, setChainOk] = useState(true);
  const [fheWallet, setFheWallet] = useState(null);
  const [balance, setBalance] = useState("");
  const [depositAmount, setDepositAmount] = useState("50");
  const [payAmount, setPayAmount] = useState("20");
  const [payTo, setPayTo] = useState(BURN_ADDRESS);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

    async function connectWallet() {
    if (!window.ethereum) {
      alert("No injected wallet found (MetaMask etc).");
      return;
    }

    try {
      setStatus("Connecting wallet...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();

      // ✅ show wallet as soon as it’s connected
      setWalletAddress(addr);

      const net = await provider.getNetwork();
      if (net.chainId !== EXPECTED_CHAIN_ID) {
        setChainOk(false);
        setStatus(
          `Wallet connected, but wrong network: expected Sepolia (${EXPECTED_CHAIN_ID}), got chainId ${net.chainId}.`
        );
        return;
      }

      setChainOk(true);

      const abi = FHEPrivateWalletArtifact.abi;

      // ✅ try to init FHE wallet separately
      try {
        const wallet = await createFheWallet({
          signer,
          contractAddress: CONTRACT_ADDRESS,
          abi,
        });

        setFheWallet(wallet);
        setStatus("Wallet connected and FHE relayer ready.");
      } catch (e) {
        console.error("createFheWallet error:", e);
        const msg = e.message || "FHE relayer failed.";

        const isRelayerFetchError =
          (e.cause && e.cause.code === "RELAYER_FETCH_ERROR") ||
          /Bad JSON/i.test(msg);

        if (isRelayerFetchError) {
          setStatus(
            "Wallet connected. FHE relayer returned bad JSON / 5xx. This is on Zama’s side – try again in a bit or keep a screenshot for your submission."
          );
        } else {
          setStatus("Wallet connected, but FHE init failed: " + msg);
        }
      }
    } catch (e) {
      console.error("connectWallet error:", e);
      setWalletAddress("");
      setFheWallet(null);
      setStatus(e.message || "Failed to connect wallet.");
    }
  }

  async function refreshBalance() {
    if (!fheWallet) return;
    setBusy(true);
    setStatus("Decrypting balance...");
    try {
      const b = await fheWallet.getBalance();
      setBalance(b.toString());
      setStatus("Balance updated.");
    } catch (e) {
      console.error("refreshBalance error:", e);
      if (e.code === "FHE_DECRYPT_UNAVAILABLE") {
        setStatus(
          "Decrypt service temporarily unavailable – encrypted balance exists but cannot be decrypted right now."
        );
      } else {
        setStatus(e.message || "Failed to get balance.");
      }
    } finally {
      setBusy(false);
    }
  }

    async function handleDeposit() {
    if (!fheWallet) {
      setStatus(
        "Cannot deposit yet: FHE relayer / encrypted wallet is not initialized. Check the Connect Wallet status above."
      );
      return;
    }
    const amt = depositAmount.trim();
    if (!amt || isNaN(Number(amt))) {
      setStatus("Deposit amount must be a number.");
      return;
    }
    setBusy(true);
    setStatus(`Depositing ${amt} (encrypted)...`);
    try {
      const receipt = await fheWallet.deposit(BigInt(amt));
      setStatus(`Deposit confirmed in tx ${receipt.hash.slice(0, 10)}…`);
      await refreshBalance();
    } catch (e) {
      console.error("handleDeposit error:", e);
      setStatus(e.message || "Deposit failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrivatePay() {
    if (!fheWallet) {
      setStatus(
        "Cannot send private payment yet: FHE relayer / encrypted wallet is not initialized. Check the Connect Wallet status above."
      );
      return;
    }
    const amt = payAmount.trim();
    if (!amt || isNaN(Number(amt))) {
      setStatus("Payment amount must be a number.");
      return;
    }
    if (!ethers.isAddress(payTo)) {
      setStatus("Recipient is not a valid address.");
      return;
    }
    setBusy(true);
    setStatus(`Paying ${amt} (encrypted) to ${payTo.slice(0, 10)}…`);
    try {
      const receipt = await fheWallet.privatePay(payTo, BigInt(amt));
      setStatus(`Payment confirmed in tx ${receipt.hash.slice(0, 10)}…`);
      await refreshBalance();
    } catch (e) {
      console.error("handlePrivatePay error:", e);
      setStatus(e.message || "Payment failed.");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050708",
        color: "#f9fafb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "1.5rem",
          borderRadius: "1rem",
          background:
            "radial-gradient(circle at top left, #111827, #020617 60%)",
          border: "1px solid #1f2937",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        }}
      >
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          FHE Private Wallet
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#9ca3af",
            marginBottom: "1rem",
          }}
        >
          Encrypted deposits &amp; private payments on Zama FHEVM (Sepolia).
        </p>

        {/* Connect */}
        <button
          onClick={connectWallet}
          disabled={busy}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "999px",
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "0.75rem",
          }}
        >
          {walletAddress ? "Reconnect Wallet" : "Connect Wallet"}
        </button>

        {walletAddress && (
          <div style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            Connected:{" "}
            <span style={{ color: "#e5e7eb" }}>
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </span>
            {!chainOk && (
              <span style={{ color: "#f97316", marginLeft: "0.5rem" }}>
                (wrong network)
              </span>
            )}
          </div>
        )}

        {/* Balance */}
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: "#020617",
            border: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
              Decrypted balance
            </span>
            <button
              onClick={refreshBalance}
              disabled={busy || !fheWallet}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "999px",
                border: "none",
                background: "#111827",
                color: "#e5e7eb",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>
          <div style={{ fontSize: "1.4rem", marginTop: "0.3rem" }}>
            {balance === "" ? "—" : balance}
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginTop: "1.2rem",
          }}
        >
          {/* Deposit */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: "0.9rem", marginBottom: "0.4rem" }}>
              Encrypted deposit
            </div>
            <input
              type="number"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                marginBottom: "0.5rem",
              }}
            />
            <button
              onClick={handleDeposit}
              disabled={busy || !fheWallet}
              style={{
                width: "100%",
                padding: "0.45rem 0.8rem",
                borderRadius: "999px",
                border: "none",
                background: "#22c55e",
                color: "#02140a",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Deposit
            </button>
          </div>

          {/* Private pay */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <div style={{ fontSize: "0.9rem", marginBottom: "0.4rem" }}>
              Private payment
            </div>
            <input
              type="number"
              min="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                marginBottom: "0.4rem",
              }}
            />
            <input
              type="text"
              value={payTo}
              onChange={(e) => setPayTo(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                marginBottom: "0.5rem",
                fontSize: "0.75rem",
              }}
            />
            <button
              onClick={handlePrivatePay}
              disabled={busy || !fheWallet}
              style={{
                width: "100%",
                padding: "0.45rem 0.8rem",
                borderRadius: "999px",
                border: "none",
                background: "#f97316",
                color: "#111827",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Private pay
            </button>
          </div>
        </div>

        {/* Status */}
        <div
          style={{
            marginTop: "1rem",
            fontSize: "0.8rem",
            color: "#9ca3af",
            minHeight: "1.4rem",
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );
}
