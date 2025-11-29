import "./App.css";

function App() {
  return (
    <div className="page">
      <header className="top-bar">
        <div className="top-bar__logo">FHE Private Wallet</div>
        <div className="top-bar__badge">Zama FHEVM · Sepolia</div>
      </header>

      <main className="shell">
        <section className="hero">
          <h1 className="hero__title">Encrypted deposits & private pay</h1>
          <p className="hero__subtitle">
            Balances and amounts stay encrypted onchain while you interact like a normal wallet.
          </p>

          <div className="hero__balance-card">
            <div className="hero__label">Decrypted balance</div>
            <div className="hero__balance">
              {/* put your decrypted balance variable here */}
              {decryptedBalance} usdFHE
            </div>
          </div>
        </section>

        <section className="wallet-card">
          <div className="wallet-card__header">
            <button className="btn btn-outline" onClick={connectWallet}>
              {connected ? "Wallet connected" : "Connect wallet"}
            </button>
            <button className="btn btn-ghost" onClick={refreshBalance}>
              Refresh
            </button>
          </div>

          <div className="wallet-grid">
            <div className="wallet-section">
              <div className="section-title">Encrypted deposit</div>
              <input
                className="field"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleDeposit}>
                Deposit
              </button>
            </div>

            <div className="wallet-section">
              <div className="section-title">Private payment</div>
              <input
                className="field"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              <input
                className="field field--address"
                type="text"
                value={payTo}
                onChange={(e) => setPayTo(e.target.value)}
              />
              <button className="btn btn-accent" onClick={handlePrivatePay}>
                Private pay
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
