"use client";

import { useWallet, usePathPayment } from "stellar-hooks";
import { useState, useEffect, FormEvent } from "react";

/**
 * Transfers Page - Client Component
 * 
 * Demonstrates a complete transaction flow using multiple hooks:
 * - useWallet: For wallet connection and management
 * - usePathPayment: For creating path payment operations
 * 
 * This page shows proper pattern for multi-step forms with hook state
 * management and error handling.
 */
export default function TransfersPage() {
  const {
    availableWallets,
    activeWallet,
    isConnected,
    publicKey,
    connect,
    disconnect,
  } = useWallet();

  const {
    pathPayment,
    isLoading,
    error,
    reset,
  } = usePathPayment();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [assetCode, setAssetCode] = useState("XLM");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      await pathPayment({
        source: publicKey,
        destination,
        destinationAmount: amount,
        destinationAsset: assetCode === "XLM" ? "native" : assetCode,
      });
      setShowSuccess(true);
      setAmount("");
    } catch (err) {
      console.error("Payment failed:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Send Payments</h1>
          <p className="text-gray-600 mb-8">
            Connect your wallet to send Stellar assets to other accounts.
          </p>
          
          {availableWallets.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800">
                No Stellar wallets detected. Please install a wallet extension.
              </p>
              <div className="mt-4 space-x-4">
                <a
                  href="https://freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Install Freighter
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Available wallets:</p>
              {availableWallets.map((wallet) => (
                <button
                  key={wallet}
                  onClick={() => connect(wallet)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-sm transition-all flex items-center justify-center gap-3"
                >
                  <span className="font-medium capitalize">{wallet}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Send Payment</h1>
            <p className="text-gray-600">Send assets to any Stellar account</p>
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200"
          >
            Disconnect
          </button>
        </div>

        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Connected: <span className="font-mono">{publicKey}</span>
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Wallet: <span className="font-medium">{activeWallet}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
              Destination Address
            </label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="G..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.5"
                step="any"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                required
              />
            </div>
            <div>
              <label htmlFor="asset" className="block text-sm font-medium text-gray-700">
                Asset
              </label>
              <select
                id="asset"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
              >
                <option value="XLM">XLM (Lumens)</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !destination || !amount}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sending..." : "Send Payment"}
            </button>
          </div>
        </form>

        {showSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-medium">Payment sent successfully!</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700 mt-1 text-sm">{error.message}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">How it works</h2>
        <ul className="space-y-2 text-gray-600 text-sm">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Connect your wallet using the button above</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Enter the recipient's Stellar address (starts with G...)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Enter the amount and select the asset to send</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>Confirm the transaction in your wallet</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
