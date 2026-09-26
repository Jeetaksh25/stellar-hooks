"use client";

import { useOperations } from "stellar-hooks";
import { useState } from "react";

/**
 * Account History Component - Client Component
 * 
 * Demonstrates using useOperations hook to display recent account transactions.
 * Shows proper error handling and loading states.
 */
export function AccountHistory() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // This component demonstrates how to use useOperations with a dynamically
  // provided public key. For a complete example, we'll use a default test key
  // in SSR-safe environments where window is not available.
  const { operations, isLoading, hasMore, loadMore } = useOperations({
    accountPubKey: publicKey || "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONDFUBV33ZQV5XLJZ",
    includeFailed: false,
  });

  const handleTestConnection = () => {
    if (typeof window !== "undefined" && (window as any).freighter) {
      (window as any).freighter.getPublicKey().then((pubKey: string) => {
        setPublicKey(pubKey);
        setError(null);
      }).catch((err: Error) => {
        setError(err);
      });
    } else {
      setError(new Error("Freighter wallet not detected. Using default test account."));
      setPublicKey(null);
    }
  };

  if (isLoading && !operations) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <span className="animate-pulse">Loading history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">{error.message}</p>
        <button
          onClick={handleTestConnection}
          className="mt-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
        >
          Try to Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold">Recent Operations</h3>
        <button
          onClick={handleTestConnection}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {publicKey ? "Change Account" : "Connect Wallet to View Your History"}
        </button>
      </div>
      
      {operations && operations.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {operations.map((op) => (
            <div key={op.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-gray-500 block mb-1">
                    #{op.id}
                  </span>
                  <p className="text-sm font-medium text-gray-900">
                    {op.type}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {op.created_at}
                  </p>
                </div>
                <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                  {op.paging_token.slice(-8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No operations found. Connect your wallet or try a different account.
        </div>
      )}

      {hasMore && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={loadMore}
            className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded hover:bg-gray-200"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
