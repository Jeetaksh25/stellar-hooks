"use client";

import { useFreighter } from "stellar-hooks";

// This is a Client Component. stellar-hooks hooks are built on browser-only
// APIs (window, wallet extensions), so they must never run on the server.
// The leading `"use client"` directive is what keeps this hook usage on the
// client while page.tsx and layout.tsx remain Server Components.
export function WalletConnect() {
  const {
    isInstalled,
    isConnected,
    publicKey,
    isLoading,
    error,
    connect,
    disconnect,
  } = useFreighter();

  if (!isInstalled) {
    return (
      <p>
        Freighter wallet not detected. Install it from{" "}
        <a
          href="https://freighter.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          freighter.app
        </a>{" "}
        to connect.
      </p>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        disabled={isLoading}
        type="button"
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
        {isLoading ? "Connecting…" : "Connect Freighter"}
      </button>
    );
  }

  return (
    <div>
      <p>
        Connected: <code>{publicKey}</code>
      </p>
      <button
        onClick={disconnect}
        type="button"
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
          marginTop: "1rem",
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
        Disconnect
      </button>
      {error && <p>{error.message}</p>}
    </div>
  );
}
