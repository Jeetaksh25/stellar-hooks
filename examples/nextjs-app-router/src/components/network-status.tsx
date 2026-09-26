"use client";

import { useNetwork, useNetworkStatus } from "stellar-hooks";
import { useState, useEffect } from "react";

/**
 * Network Status Component - Client Component
 * 
 * Demonstrates using network-related hooks to display current network information.
 * Shows proper SSR-safe implementation with typeof window checks.
 */
export function NetworkStatus() {
  const { network, config } = useNetwork();
  const { status, isLoading, refresh } = useNetworkStatus();

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    await refresh();
    setLastUpdated(new Date());
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <span className="animate-pulse">Loading network status...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold">Network Status</h3>
        <span className="text-xs text-gray-500">
          Last updated: {lastUpdated?.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Network</p>
            <p className="font-mono text-sm font-medium text-gray-900">
              {network || "Test SDF Network"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Network Passphrase</p>
            <p className="text-sm text-gray-900 truncate">
              {config?.networkPassphrase || "Not available"}
            </p>
          </div>
        </div>

        {status && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Horizon Status</h4>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  status.status === "ok" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <p className="text-sm text-gray-900">
                Status: {status.status}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Current Ledger</p>
                <p className="text-sm font-mono text-gray-900">
                  #{status.current_ledger}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Close Time</p>
                <p className="text-sm text-gray-900">
                  {new Date(status.current_ledger_close_time).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Refreshing..." : "Refresh Status"}
          </button>
        </div>
      </div>
    </div>
  );
}
