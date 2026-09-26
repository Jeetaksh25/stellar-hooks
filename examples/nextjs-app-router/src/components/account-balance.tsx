"use client";

import { useStellarBalance } from "stellar-hooks";
import { useState } from "react";

/**
 * Account Balance Component - Client Component
 * 
 * Demonstrates using useStellarBalance hook safely in a Next.js App Router
 * client component. The hook automatically handles SSR and displays appropriate
 * loading/error states.
 */
export function AccountBalance() {
  const { balance, isLoading, error, refresh } = useStellarBalance();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (isLoading && !balance) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <span className="animate-pulse">Loading balance...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800">Error loading balance</h3>
        <p className="text-red-700 mt-1">{error.message}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">XLM Balance</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {balance ? balance.toNumber().toFixed(7) : "0.0000000"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {balance ? `${balance.toNumber().toFixed(7)} XLM` : "Not connected"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || refreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}
