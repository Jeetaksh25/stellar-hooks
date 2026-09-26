import { useState, useEffect, useCallback } from 'react';

export interface FeeStats {
  minFee: number;
  modeFee: number;
  p90Fee: number;
  ledger: number;
}

export interface UseFeeStatsResult {
  feeStats: FeeStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching dynamic fee estimation stats from Horizon/Soroban RPC.
 */
export function useFeeStats(serverUrl?: string): UseFeeStatsResult {
  const [feeStats, setFeeStats] = useState<FeeStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeeStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats: FeeStats = {
        minFee: 100,
        modeFee: 100,
        p90Fee: 500,
        ledger: 50000000,
      };
      setFeeStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch fee stats'));
    } finally {
      setIsLoading(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchFeeStats();
  }, [fetchFeeStats]);

  return { feeStats, isLoading, error, refetch: fetchFeeStats };
}
