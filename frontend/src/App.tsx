import { useState } from "react";

type TxState = "idle" | "pending" | "ok" | "error";

function App() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const [depositAmount, setDepositAmount] = useState("50");
  const [payAmount, setPayAmount] = useState("20");
  const [payTo, setPayTo] = useState(
    "0x0000000000000000000000000000000000000000"
  );
  const [withdrawAmount, setWithdrawAmount] = useState("20");

  const [txState, setTxState] = useState<TxState>("idle");
  const [txMessage, setTxMessage] = useState<string | null>(null);

  const cashierAddress =
    import.meta.env.VITE_CASHIER_ADDRESS ??
    "0x0000000000000000000000000000000000000000";

  async function handleConnect() {
    try {
      // Plug your existing EVM/FHE connect flow here.
      // Example (if you use window.ethereum):
      //
      // const [acc] = await window.ethereum.request({
      //   method: "eth_requestAccounts",
      // });
      // setAddress(acc);
      //
      // For now we just mark as connected:
      setConnected(true);
      setAddress("0x…"); // replace with real signer
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshBalance() {
    if (!connected) return;
    setLoadingBalance(true);
    setTxMessage(null);
    try {
      // Call your existing “decrypt balance” helper here and set result.
      //
      // const decrypted = await getDecryptedBalance();
      // setBalance(decrypted.toString());
      //
      // Temporary placeholder:
      setBalance("430");
    } catch (err) {
      console.error(err);
      setTxMessage("Balance refresh failed (relayer might be down).");
    } finally {
      setLoadingBalance(false);
    }
  }

  async function handleDeposit() {
    if (!connected) return;
    setTxState("pending");
    setTxMessage(null);

    try {
      const amt = Number(depositAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setTxState("error");
        setTxMessage("Deposit amount must be positive.");
        return;
      }

      // Wire this to your FHEVM deposit flow:
      // await encryptedDeposit(amt);
      //
      setTxState("ok");
      setTxMessage(`Encrypted deposit of ${amt} planned.`);
      await refreshBalance();
    } catch (err) {
      console.error(err);
      setTxState("error");
      setTxMessage("Deposit failed (check relayer / RPC).");
    }
  }

  async function handlePrivatePay() {
    if (!connected) return;
    setTxState("pending");
    setTxMessage(null);

    try {
      const amt = Number(payAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setTxState("error");
        setTxMessage("Payment amount must be positive.");
        return;
      }

      // Wire this to your encrypted privatePay(to, amount) flow.
      // await privatePay(payTo, amt);
      //
      setTxState("ok");
      setTxMessage(`Private payment of ${amt} planned to ${payTo}.`);
      await refreshBalance();
    } catch (err) {
      console.error(err);
      setTxState("error");
      setTxMessage("Private payment failed.");
    }
  }

  async function handleWithdraw() {
    if (!connected) return;
    setTxState("pending");
    setTxMessage(null);

    try {
      const amt = Number(withdrawAmount);
      if (!Number.isFinite(amt) || amt <= 0) {
        setTxState("error");
        setTxMessage("Withdraw amount must be positive.");
        return;
      }

      // Two options, depending on the contract you ended up with:
      // 1) If you have withdrawToCashier(euint64, proof):
      //    await withdrawToCashier(amt);
      //
      // 2) If “withdraw” is just privatePay to cashier:
      //    await privatePay(cashierAddress, amt);
      //
      setTxState("ok");
      setTxMessage(
        `Withdraw of ${amt} planned to cashier ${short(cashierAddress)}.`
      );
      await refreshBalance();
    } catch (err) {
      console.error(err);
      setTxState("error");
      setTxMessage("Withdraw failed.");
    }
  }

  const short = (addr: string | null | undefined) =>
    addr && addr.length > 10
      ? `${addr.slice(0, 6)}…${addr.slice(addr.length - 4)}`
      : addr ?? "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFD500",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          borderRadius: "24px",
          padding: "32px 32px 40px",
          background:
            "radial-gradient(circle at top, #151937 0, #050816 40%, #030712 100%)",
          color: "#F5F7FF",
          boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1.5rem",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.8rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#FFE16A",
                marginBottom: "6px",
              }}
            >
              Confidential DeFi · Demo
            </div>
            <h1
              style={{
                fontSize: "1.9rem",
                fontWeight: 700,
                margin: 0,
              }}
            >
              FHE Private Wallet
            </h1>
            <p
              style={{
                marginTop: "6px",
                fontSize: "0.95rem",
                color: "#A5B2FF",
              }}
            >
              Encrypted deposits &amp; private payments on Zama FHEVM (Sepolia).
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <button
              onClick={connected ? refreshBalance : handleConnect}
              style={{
                padding: "0.55rem 1.6rem",
                borderRadius: "999px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                background: connected ? "#1F6BFF" : "#2F7BFF",
                color: "#F9FBFF",
                boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              }}
            >
              {connected ? "Refresh balance" : "Connect wallet"}
            </button>
            <div
              style={{
                marginTop: "6px",
                fontSize: "0.8rem",
                color: "#7D88C7",
              }}
            >
              {connected && address ? (
                <>Signer: {short(address)}</>
              ) : (
                <>Not connected</>
              )}
            </div>
          </div>
        </header>

        {/* Balance row */}
        <section
          style={{
            marginBottom: "28px",
            padding: "16px 18px",
            borderRadius: "16px",
            background:
              "linear-gradient(120deg, rgba(146,163,255,0.14), rgba(26,34,80,0.7))",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#A5B2FF",
                marginBottom: "4px",
              }}
            >
              Decrypted balance
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              {loadingBalance
                ? "…"
                : balance !== null
                ? `${balance} usdFHE`
                : "——"}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#8994D4",
              textAlign: "right",
            }}
          >
            Balances and amounts are kept as encrypted{" "}
            <code style={{ fontSize: "0.75rem" }}>euint64</code> values onchain.
            The relayer and FHEVM SDK decrypt them only for the signer.
          </div>
        </section>

        {/* Forms grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "20px",
          }}
        >
          {/* Deposit */}
          <div
            style={{
              padding: "16px 18px 18px",
              borderRadius: "16px",
              background: "rgba(10,14,40,0.95)",
              border: "1px solid rgba(88,108,255,0.35)",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                margin: 0,
                marginBottom: "12px",
              }}
            >
              Encrypted deposit
            </h2>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#8A96D5",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Amount (usdFHE)
            </label>
            <input
              type="number"
              min={0}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #243066",
                padding: "8px 10px",
                background: "#050818",
                color: "#F5F7FF",
                fontSize: "0.9rem",
                marginBottom: "12px",
              }}
            />
            <button
              onClick={handleDeposit}
              disabled={!connected}
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: "999px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: connected ? "pointer" : "not-allowed",
                background: connected ? "#1BC773" : "#1B3A3B",
                color: "#03130A",
              }}
            >
              Deposit
            </button>
          </div>

          {/* Private pay */}
          <div
            style={{
              padding: "16px 18px 18px",
              borderRadius: "16px",
              background: "rgba(10,14,40,0.95)",
              border: "1px solid rgba(255,145,77,0.45)",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                margin: 0,
                marginBottom: "12px",
              }}
            >
              Private payment
            </h2>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#8A96D5",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Amount (usdFHE)
            </label>
            <input
              type="number"
              min={0}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #243066",
                padding: "8px 10px",
                background: "#050818",
                color: "#F5F7FF",
                fontSize: "0.9rem",
                marginBottom: "10px",
              }}
            />
            <label
              style={{
                fontSize: "0.8rem",
                color: "#8A96D5",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Recipient
            </label>
            <input
              type="text"
              value={payTo}
              onChange={(e) => setPayTo(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #243066",
                padding: "8px 10px",
                background: "#050818",
                color: "#F5F7FF",
                fontSize: "0.8rem",
                marginBottom: "12px",
              }}
            />
            <button
              onClick={handlePrivatePay}
              disabled={!connected}
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: "999px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: connected ? "pointer" : "not-allowed",
                background: connected ? "#FF8F3C" : "#3F2A18",
                color: "#1A0904",
              }}
            >
              Private pay
            </button>
          </div>

          {/* Withdraw to cashier */}
          <div
            style={{
              padding: "16px 18px 18px",
              borderRadius: "16px",
              background: "rgba(10,14,40,0.95)",
              border: "1px solid rgba(144,255,203,0.4)",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                margin: 0,
                marginBottom: "12px",
              }}
            >
              Withdraw to cashier
            </h2>
            <label
              style={{
                fontSize: "0.8rem",
                color: "#8A96D5",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Amount (usdFHE)
            </label>
            <input
              type="number"
              min={0}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid #243066",
                padding: "8px 10px",
                background: "#050818",
                color: "#F5F7FF",
                fontSize: "0.9rem",
                marginBottom: "10px",
              }}
            />
            <label
              style={{
                fontSize: "0.8rem",
                color: "#8A96D5",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Cashier (fixed)
            </label>
            <div
              style={{
                fontSize: "0.8rem",
                padding: "7px 10px",
                borderRadius: "10px",
                background: "rgba(20,30,70,0.9)",
                border: "1px dashed #33407A",
                color: "#C2CEFF",
                marginBottom: "12px",
                wordBreak: "break-all",
              }}
            >
              {cashierAddress}
            </div>
            <button
              onClick={handleWithdraw}
              disabled={!connected}
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: "999px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: connected ? "pointer" : "not-allowed",
                background: connected ? "#7CFBC4" : "#274236",
                color: "#012312",
              }}
            >
              Withdraw
            </button>
          </div>
        </section>

        {/* Status line */}
        {txMessage && (
          <div
            style={{
              marginTop: "18px",
              fontSize: "0.85rem",
              color:
                txState === "error"
                  ? "#FFB3B3"
                  : txState === "ok"
                  ? "#9AF5C5"
                  : "#B5C1FF",
            }}
          >
            {txMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
