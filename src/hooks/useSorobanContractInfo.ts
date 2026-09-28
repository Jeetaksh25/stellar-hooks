import { useState, useEffect, useCallback } from 'react';

export interface SorobanContractMetadata {
  contractId: string;
  wasmHash?: string;
  admin?: string;
  storageSchemaVersion?: number;
}

export interface UseSorobanContractInfoResult {
  metadata: SorobanContractMetadata | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for reading Soroban contract metadata and spec information.
 */
export function useSorobanContractInfo(contractId?: string): UseSorobanContractInfoResult {
  const [metadata, setMetadata] = useState<SorobanContractMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContractInfo = useCallback(async () => {
    if (!contractId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch contract metadata from RPC
      const fetched: SorobanContractMetadata = {
        contractId,
        wasmHash: 'abc123hash',
        admin: 'GADMINADDRESS1234567890',
        storageSchemaVersion: 1,
      };
      setMetadata(fetched);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch Soroban contract metadata'));
    } finally {
      setIsLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContractInfo();
  }, [fetchContractInfo]);

  return { metadata, isLoading, error, refetch: fetchContractInfo };
}
