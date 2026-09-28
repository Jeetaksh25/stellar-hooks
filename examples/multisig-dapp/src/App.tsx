/**
 * examples/multisig-dapp/src/App.tsx
 *
 * Example app demonstrating a multi-signature transaction workflow using `useMultiSig`.
 * Covers building an unsigned transaction, collecting signatures from multiple signers,
 * inspecting signature counts, and submitting the multi-signed XDR.
 *
 * npm install && npm run dev
 */

import React, { useState } from "react";
import {
  StellarProvider,
  useFreighter,
  useMultiSig,
} from "stellar-hooks";
import { Operation, Asset } from "@stellar/stellar-sdk";

// ─── Multisig Inner App ────────────────────────────────────────────────────────

function MultiSigWorkflow() {
  const { isConnected, publicKey, connect } = useFreighter();
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("10");
  const [customXdrInput, setCustomXdrInput] = useState("");

  const {
    build,
    sign,
    submit,
    reset,
    unsignedXdr,
    signatureCount,
    status,
    hash,
    error,
    isLoading,
    isSuccess,
    isError,
  } = useMultiSig({
    fee: 100,
    onSuccess: (txHash) => {
      console.log("Multisig transaction succeeded:", txHash);
    },
  });

  if (!isConnected || !publicKey) {
    return (
      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <p>Connect your wallet to start the multi-signature transaction workflow.</p>
        <button
          onClick={connect}
          style={{
            padding: "0.75rem 1.5rem",
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
          Connect Freighter
        </button>
      </div>
    );
  }

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !amount) return;

    try {
      const op = Operation.payment({
        destination,
        amount,
        asset: Asset.native(),
      });
      const builtXdr = await build([op], { memo: "Multisig Payment" });
      setCustomXdrInput(builtXdr);
    } catch (err) {
      console.error("Failed to build transaction:", err);
    }
  };

  const handleSign = async () => {
    const targetXdr = customXdrInput || unsignedXdr;
    if (!targetXdr) return;

    try {
      const signedXdr = await sign(targetXdr);
      setCustomXdrInput(signedXdr);
    } catch (err) {
      console.error("Failed to sign transaction:", err);
    }
  };

  const handleSubmit = async () => {
    const xdrToSubmit = customXdrInput || unsignedXdr;
    if (!xdrToSubmit) return;

    try {
      await submit(xdrToSubmit);
    } catch (err) {
      console.error("Failed to submit transaction:", err);
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Step 1: Build */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
        <h3>Step 1: Build Unsigned Transaction</h3>
        <form onSubmit={handleBuild}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="multisig-dest">Recipient Public Key:</label>
            <input
              id="multisig-dest"
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
          <div style={{ marginBottom: "0.5rem" }}>
            <label htmlFor="multisig-amount">Amount (XLM):</label>
            <input
              id="multisig-amount"
              type="number"
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
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: 6,
              border: "none",
              background: isLoading ? "#9ca3af" : "#2563eb",
              color: isLoading ? "#6b7280" : "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              outline: "none",
              transition: "box-shadow 0.15s ease, transform 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onFocus={(e) => {
              if (!isLoading) {
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.3)";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Build Unsigned XDR
          </button>
        </form>
      </section>

      {/* Step 2: Collect Signatures */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
        <h3>Step 2: Sign & Collect Signatures</h3>
        <p>
          Current Signatures Count: <strong>{signatureCount}</strong>
        </p>
        <div style={{ marginBottom: "0.5rem" }}>
          <label htmlFor="xdr-area">Transaction XDR (Unsigned / Partially Signed):</label>
          <textarea
            id="xdr-area"
            rows={5}
            value={customXdrInput || unsignedXdr || ""}
            onChange={(e) => setCustomXdrInput(e.target.value)}
            placeholder="Build transaction above or paste XDR here..."
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              padding: "0.5rem",
              borderRadius: 6,
              border: "1px solid #d1d5db",
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
          type="button"
          onClick={handleSign}
          disabled={isLoading || (!customXdrInput && !unsignedXdr)}
          style={{
            marginRight: "0.5rem",
            padding: "0.55rem 1.25rem",
            borderRadius: 6,
            border: "none",
            background: isLoading || (!customXdrInput && !unsignedXdr) ? "#9ca3af" : "#8b5cf6",
            color: isLoading || (!customXdrInput && !unsignedXdr) ? "#6b7280" : "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "box-shadow 0.15s ease, transform 0.1s ease",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && (customXdrInput || unsignedXdr)) {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onFocus={(e) => {
            if (!isLoading && (customXdrInput || unsignedXdr)) {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 92, 246, 0.3)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Sign with Connected Wallet
        </button>
      </section>

      {/* Step 3: Submit Transaction */}
      <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
        <h3>Step 3: Submit Multi-Signed Transaction</h3>
        <p>Status: <strong>{status}</strong></p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || (!customXdrInput && !unsignedXdr)}
          style={{
            padding: "0.55rem 1.25rem",
            borderRadius: 6,
            border: "none",
            background: isLoading || (!customXdrInput && !unsignedXdr) ? "#9ca3af" : "#059669",
            color: isLoading || (!customXdrInput && !unsignedXdr) ? "#6b7280" : "#fff",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "box-shadow 0.15s ease, transform 0.1s ease",
          }}
          onMouseEnter={(e) => {
            if (!isLoading && (customXdrInput || unsignedXdr)) {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5, 150, 105, 0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onFocus={(e) => {
            if (!isLoading && (customXdrInput || unsignedXdr)) {
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5, 150, 105, 0.3)";
            }
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {isLoading ? "Submitting..." : "Submit Transaction"}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{
            marginLeft: "0.5rem",
            padding: "0.55rem 1.25rem",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            outline: "none",
            transition: "box-shadow 0.15s ease, transform 0.1s ease",
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
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(148, 163, 184, 0.4)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Reset
        </button>

        {isSuccess && hash && (
          <div style={{ color: "green", marginTop: "1rem" }}>
            <p>✅ Multisig transaction broadcast successfully!</p>
            <p>
              Hash:{" "}
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
                target="_blank"
                rel="noreferrer"
              >
                {hash}
              </a>
            </p>
          </div>
        )}

        {/* Transaction status announcements (screen readers) */}
        <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
          {isLoading && "Submitting transaction…"}
          {isSuccess && hash && `Multisig transaction broadcast successfully! Transaction hash: ${hash}`}
          {isError && error && `Submission error: ${error.message}`}
        </div>

        {isError && error && (
          <div style={{ color: "red", marginTop: "1rem" }}>
            <p className="error">❌ Submission Error: {error.message}</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Root Component ────────────────────────────────────────────────────────────

export default function App() {
  return (
    <StellarProvider network="testnet">
      <main style={{ fontFamily: "sans-serif", maxWidth: 680, margin: "2rem auto", padding: "0 1rem" }}>
        <h1>Multisig Signing Workflow Example</h1>
        <p>
          Demonstrates using <code>useMultiSig</code> to compose a transaction, sign with multiple signers,
          track signature counts, and broadcast to Stellar testnet.
        </p>
        <MultiSigWorkflow />
      </main>
    </StellarProvider>
  );
}
