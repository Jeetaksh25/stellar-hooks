/**
 * examples/mainnet-payment-dapp/src/App.tsx
 *
 * Minimal mainnet-configured payment dApp demonstrating wallet connection,
 * fetching live XLM mainnet balance, and submitting native Stellar payments.
 *
 * npm install && npm run dev
 */

import React, { useState } from "react";
import {
  StellarProvider,
  useFreighter,
  useStellarBalance,
  usePayment,
} from "stellar-hooks";

// ─── Inner components (must be inside <StellarProvider network="mainnet">) ───

function WalletSection() {
  const {
    isInstalled,
    isConnected,
    publicKey,
    isLoading,
    error,
    networkPassphraseMismatch,
    networkPassphraseWarning,
    connect,
    disconnect,
  } = useFreighter();

  if (!isInstalled) {
    return <p className="warn">Freighter wallet not detected. Please install Freighter extension.</p>;
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isLoading}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 6,
          border: "2px solid #2563eb",
          background: "#fff",
          color: "#1e40af",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "1rem",
          outline: "none",
          transition: "box-shadow 0.15s ease, transform 0.1s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
          e.currentTarget.style.borderColor = "#1d4ed8";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "#2563eb";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {isLoading ? "Connecting…" : "Connect Freighter Wallet"}
      </button>
    );
  }

  return (
    <div className="wallet-card">
      <p>
        ✅ <strong>Connected Mainnet Account:</strong> <code>{publicKey}</code>
      </p>
      {networkPassphraseMismatch && networkPassphraseWarning && (
        <p className="warn">{networkPassphraseWarning}</p>
      )}
      <button
        onClick={disconnect}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 6,
          border: "2px solid #dc2626",
          background: "#fff",
          color: "#991b1b",
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "1rem",
          outline: "none",
          transition: "box-shadow 0.15s ease, transform 0.1s ease",
          marginTop: "0.75rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.3)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.3)";
          e.currentTarget.style.borderColor = "#b91c1c";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.borderColor = "#dc2626";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Disconnect Wallet
      </button>
      {error && <p className="error">{error.message}</p>}
    </div>
  );
}

function BalanceSection({ publicKey }: { publicKey: string }) {
  const { xlmBalance, balances, isLoading, refetch } = useStellarBalance(publicKey, {
    refetchInterval: 15_000,
  });

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2>Mainnet Balances</h2>
      {isLoading && <p>Fetching live mainnet balances…</p>}
      <p>
        <strong>XLM Balance:</strong> {xlmBalance?.balance ?? "0.0000000"} XLM
      </p>
      {balances.filter((b) => !b.isNative).length > 0 && (
        <div>
          <h3>Other Assets:</h3>
          <ul>
            {balances
              .filter((b) => !b.isNative)
              .map((b, i) => (
                <li key={i}>
                  {b.assetCode}/{b.assetIssuer?.slice(0, 8)}… — {b.balance}
                </li>
              ))}
          </ul>
        </div>
      )}
      <button
        onClick={refetch}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          background: "#f9fafb",
          fontWeight: 600,
          fontSize: "0.9rem",
          cursor: "pointer",
          outline: "none",
          transition: "box-shadow 0.15s ease, transform 0.1s ease",
          marginTop: "0.75rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.3)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.3)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Refresh Balances
      </button>
    </section>
  );
}

function PaymentSection() {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const { submit, status, hash, error, isLoading, isSuccess, isError, reset } = usePayment({
    destination,
    amount,
    memo: memo.trim() || undefined,
  });

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !amount) return;
    try {
      await submit();
    } catch {
      // Handled by hook error state
    }
  };

  return (
    <section style={{ marginTop: "1.5rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
      <h2>Send Mainnet XLM</h2>
      <form onSubmit={handleSendPayment}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="destination-input">Recipient Stellar Public Key (G...):</label>
          <br />
          <input
            id="destination-input"
            type="text"
            placeholder="G..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: "1rem",
              outline: "none",
              transition: "box-shadow 0.15s ease, border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
              e.currentTarget.style.borderColor = "#2563eb";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="amount-input">Amount (XLM):</label>
          <br />
          <input
            id="amount-input"
            type="number"
            step="any"
            placeholder="1.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: "1rem",
              outline: "none",
              transition: "box-shadow 0.15s ease, border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
              e.currentTarget.style.borderColor = "#2563eb";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
            required
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="memo-input">Memo (optional):</label>
          <br />
          <input
            id="memo-input"
            type="text"
            placeholder="Payment description"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem",
              marginTop: "0.25rem",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              fontSize: "1rem",
              outline: "none",
              transition: "box-shadow 0.15s ease, border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
              e.currentTarget.style.borderColor = "#2563eb";
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !destination || !amount}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            borderRadius: 6,
            border: "none",
            background: isLoading || !destination || !amount ? "#9ca3af" : "#2563eb",
            color: isLoading || !destination || !amount ? "#6b7280" : "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            outline: "none",
            transition: "box-shadow 0.15s ease, transform 0.1s ease",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && destination && amount) {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onFocus={(e) => {
            if (!isLoading && destination && amount) {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {isLoading ? "Submitting Payment…" : "Send Mainnet XLM"}
        </button>

        {/* Transaction status announcements (screen readers) */}
        <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
          {status === "idle" && "Ready to send payment"}
          {status === "submitting" && "Submitting payment to network…"}
          {status === "polling" && "Waiting for confirmation…"}
          {isSuccess && hash && `Payment submitted successfully. Transaction hash: ${hash.slice(0, 10)}…${hash.slice(-8)}`}
          {isError && error && `Payment failed. ${error.message}`}
        </div>

        {isSuccess && (
          <div style={{ color: "green", marginTop: "1rem" }}>
            <p>✅ Payment submitted successfully!</p>
            {hash && (
              <p>
                Transaction Hash:{" "}
                <a
                  href={`https://stellarexpert.com/explorer/public/tx/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {hash.slice(0, 10)}…{hash.slice(-8)}
                </a>
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                outline: "none",
                transition: "box-shadow 0.15s ease, transform 0.1s ease",
                marginLeft: "0.75rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Send Another
            </button>
          </div>
        )}

        {isError && error && (
          <div style={{ color: "red", marginTop: "1rem" }}>
            <p className="error">❌ Payment failed: {error.message}</p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                outline: "none",
                transition: "box-shadow 0.15s ease, transform 0.1s ease",
                marginLeft: "0.75rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.3)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </form>
      <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem" }}>
        Status: <strong>{status}</strong>
      </p>
    </section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function MainnetAppInner() {
  const { isConnected, publicKey } = useFreighter();

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>stellar-hooks Mainnet Payment dApp</h1>
      <p>Configured for <strong>Stellar Mainnet</strong>.</p>
      <WalletSection />
      {isConnected && publicKey && (
        <>
          <BalanceSection publicKey={publicKey} />
          <PaymentSection />
        </>
      )}
    </main>
  );
}

export default function App() {
  return (
    <StellarProvider network="mainnet">
      <MainnetAppInner />
    </StellarProvider>
  );
}
