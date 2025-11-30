// frontend/src/App.jsx
import { useState } from "react";
import "./App.css";

function shorten(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connecting, setConnecting] = useState(false);

  const [balance, setBalance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [depositAmount, setDepositAmount] = useState("50");
  const [payAmount, setPayAmount] = useState("20");
  const [withdrawAmount, setWithdrawAmount] = useState("20");
  const [payTo, setPayTo] = useState(
    "0x0000000000000000000000000000000000000000"
  );

  const [depositing, setDepositing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const cashierAddress =
    import.meta.env.VITE_CASHIER_ADDRESS ||
    "0x5d8668cADB497D62d62C1FF8AFF801E8151E849F";

  async function connectWallet() {
    if (!window.ethereum) {
      alert("No wallet found. Please install MetaMask.");
      return;
    }
    try {
      setConnecting(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      console.error("connectWallet error:", err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleRefreshBalance() {
    if (!walletAddress) return;
    try {
      setRefreshing(true);
      // Hook this into your FHE decrypt flow.
      // For now this is just a placeholder.
      console.log("refresh balance for", walletAddress);
      // Example: setBalance(430);
      setBalance((prev) => prev ?? 430);
    } catch (err) {
      console.error("refresh balance error:", err);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeposit() {
    if (!walletAddress) return;
    try {
      setDepositing(true);
      console.log("deposit", depositAmount);
      // Wire: encrypted deposit call here
    } catch (err) {
      console.error("deposit error:", err);
    } finally {
      setDepositing(false);
    }
  }

  async function handlePrivatePay() {
    if (!walletAddress) return;
    try {
      setPaying(true);
      console.log("privatePay", payAmount, "to", payTo);
      // Wire: privatePay(to, amount) call here
    } catch (err) {
      console.error("private pay error:", err);
    } finally {
      setPaying(false);
    }
  }

  async function handleWithdraw() {
    if (!walletAddress) return;
    try {
      setWithdrawing(true);
      console.log("withdraw", withdrawAmount, "to cashier", cashierAddress);
      // Wire: withdrawToCashier(amount) or privatePay(cashier, amount)
    } catch (err) {
      console.error("withdraw error:", err);
    } finally {
      setWithdrawing(false);
    }
  }

  const connected = !!walletAddress;

  return (
    <div className="app-root">
      <div className="app-card">
        {/* Header */}
        <div className="header-row">
          <div>
            <h1 className="app-title">FHE Private Wallet</h1>
            <p className="app-subtitle">
              Encrypted deposits &amp; private payments on Zama FHEVM (Sepolia).
            </p>
          </div>
          <div className="connect-block">
            {connected ? (
              <button className="pill pill-connected" type="button">
                {shorten(walletAddress)}
              </button>
            ) : (
              <button
                className="pill pill-primary"
                type="button"
                onClick={connectWallet}
                disabled={connecting}
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>

        {/* Balance row */}
        <div className="balance-row">
          <div>
            <div className="balance-label">Decrypted balance</div>
            <div className="balance-value">
              {balance === null ? "—" : `${balance} usdFHE`}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRefreshBalance}
            disabled={!connected || refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* Panels */}
        <div className="panels">
          {/* Deposit panel */}
          <div className="panel">
            <h3 className="panel-title">Encrypted deposit</h3>

            <label className="field-label">Amount (usdFHE)</label>
            <input
              type="number"
              min={0}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="field-input"
            />

            <button
              type="button"
              className="btn btn-green"
              onClick={handleDeposit}
              disabled={!connected || depositing}
            >
              {depositing ? "Depositing…" : "Deposit"}
            </button>
          </div>

          {/* Private pay panel */}
          <div className="panel">
            <h3 className="panel-title">Private payment</h3>

            <label className="field-label">Amount (usdFHE)</label>
            <input
              type="number"
              min={0}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="field-input"
            />

            <label className="field-label">Recipient</label>
            <input
              type="text"
              value={payTo}
              onChange={(e) => setPayTo(e.target.value)}
              className="field-input"
            />

            <button
              type="button"
              className="btn btn-orange"
              onClick={handlePrivatePay}
              disabled={!connected || paying}
            >
              {paying ? "Sending…" : "Private pay"}
            </button>
          </div>

          {/* Withdraw panel */}
          <div className="panel">
            <h3 className="panel-title">Withdraw to cashier</h3>

            <label className="field-label">Amount (usdFHE)</label>
            <input
              type="number"
              min={0}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="field-input"
            />

            <label className="field-label">Cashier</label>
            <div className="cashier-box">{cashierAddress}</div>

            <button
              type="button"
              className="btn btn-mint"
              onClick={handleWithdraw}
              disabled={!connected || withdrawing}
            >
              {withdrawing ? "Withdrawing…" : "Withdraw"}
            </button>
          </div>
        </div>

        {/* Tiny footer line */}
        <div className="footer-note">
          Logic runs against the FHE Private Wallet contract on Sepolia.
          Decryption happens offchain via the FHEVM relayer.
        </div>
      </div>
    </div>
  );
}

export default App;
