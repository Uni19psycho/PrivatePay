import "./App.css";

const FHE_WALLET_ADDRESS = "0xf8365cb4e47EbdF14bc57880a41eD156Eae481A0";
const CASHIER_ADDRESS = "0x5d8668cADB497D62d62C1FF8AFF801E8151E849F";
const USD_FHE_ADDRESS = "0x15Bf4B782Ac42d5EB7fBd3aEbb9736b4e2C625bd";

function App() {
  return (
    <div className="app-root">
      <header className="hero">
        <h1>FHE Private Wallet</h1>
        <p>Logic prototype on Zama FHEVM (Sepolia)</p>
      </header>

      <main className="content">
        <section className="card">
          <h2>What this demo does</h2>
          <ul>
            <li>Encrypted balances per address (euint64 onchain).</li>
            <li>Encrypted deposits using Zama&apos;s relayer SDK.</li>
            <li>Private payments recorded with <code>privatePay</code>.</li>
            <li>Withdraw pattern that routes funds to a cashier address.</li>
          </ul>
          <p className="note">
            All decryption happens offchain via the relayer. If the relayer is
            down, decrypt calls can fail even while onchain state is correct.
          </p>
        </section>

        <section className="card">
          <h2>Deployed contracts (Sepolia)</h2>
          <div className="address-row">
            <span>FHEPrivateWallet:</span>
            <code>{FHE_WALLET_ADDRESS}</code>
          </div>
          <div className="address-row">
            <span>usdFHE token:</span>
            <code>{USD_FHE_ADDRESS}</code>
          </div>
          <div className="address-row">
            <span>Cashier address:</span>
            <code>{CASHIER_ADDRESS}</code>
          </div>
        </section>

        <section className="card">
          <h2>How it&apos;s wired today</h2>
          <ol>
            <li>Contracts are deployed via Hardhat using the FHEVM template.</li>
            <li>
              CLI script <code>Test.mjs</code> performs deposit, private pay and
              withdrawal on encrypted balances.
            </li>
            <li>
              A Telegram bot talks to the same wallet contract and shows
              balances and transfers from chat.
            </li>
          </ol>
          <p className="note">
            This frontend is read-only for now. All value moves through the CLI
            and bot, which hit the FHEVM relayer directly.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
