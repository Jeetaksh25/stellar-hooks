/**
 * @file useLedgerInfo.ts
 * @description Hook returning the latest closed ledger sequence, close
 *   time, and base fee/reserve, refreshed on an interval.
 * @package stellar-hooks
 * @license MIT
 */

import { useCallback } from "react";
import { useStellarContext } from "../context";
import { useStellarQuery } from "./useStellarQuery";

export interface LedgerInfo {
  sequence: number;
  closedAt: string;
  hash: string;
  baseFeeInStroops: number;
  baseReserveInStroops: number;
  protocolVersion: number;
}

export interface UseLedgerInfoOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export interface UseLedgerInfoReturn {
  ledgerInfo: LedgerInfo | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/** Horizon returns snake_case; accept either shape for mocks / live network. */
interface HorizonLedgerRecord {
  sequence?: number;
  closed_at?: string;
  closedAt?: string;
  hash?: string;
  base_fee_in_stroops?: number;
  baseFeeInStroops?: number;
  base_reserve_in_stroops?: number;
  baseReserveInStroops?: number;
  protocol_version?: number;
  protocolVersion?: number;
}

interface HorizonLedgersPage {
  _embedded?: { records?: HorizonLedgerRecord[] };
  records?: HorizonLedgerRecord[];
}

/**
 * Normalize a Horizon ledger record (snake_case) into the camelCase
 * LedgerInfo surface used by consumers. CamelCase payloads (e.g. unit-test
 * mocks) pass through.
 */
export function normalizeLedgerInfo(raw: HorizonLedgerRecord): LedgerInfo {
  return {
    sequence: raw.sequence ?? 0,
    closedAt: raw.closedAt ?? raw.closed_at ?? "",
    hash: raw.hash ?? "",
    baseFeeInStroops: raw.baseFeeInStroops ?? raw.base_fee_in_stroops ?? 0,
    baseReserveInStroops:
      raw.baseReserveInStroops ?? raw.base_reserve_in_stroops ?? 0,
    protocolVersion: raw.protocolVersion ?? raw.protocol_version ?? 0,
  };
}

/**
 * Fetches metadata for the most recently closed ledger: sequence number,
 * close time, base fee, and base reserve (all in stroops).
 *
 * @example
 * ```tsx
 * const { ledgerInfo, isLoading } = useLedgerInfo({ refetchInterval: 5_000 });
 * // ledgerInfo.sequence: 51234567
 * // ledgerInfo.baseFeeInStroops: 100
 * // ledgerInfo.baseReserveInStroops: 5000000
 * ```
 */
export function useLedgerInfo(
  options: UseLedgerInfoOptions = {}
): UseLedgerInfoReturn {
  const { refetchInterval = 0, enabled = true } = options;
  const { config } = useStellarContext();

  const fetcher = useCallback(async (signal?: AbortSignal): Promise<LedgerInfo | null> => {
    const url = `${config.horizonUrl.replace(/\/$/, "")}/ledgers?order=desc&limit=1`;
    const response = await fetch(url, {
      ...(signal && { signal }),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ledger info: ${response.status}`);
    }
    const payload = (await response.json()) as HorizonLedgersPage;
    const record = payload._embedded?.records?.[0] ?? payload.records?.[0];
    if (!record) {
      throw new Error("Invalid ledgers payload: no records returned");
    }
    return normalizeLedgerInfo(record);
  }, [config.horizonUrl]);

  const state = useStellarQuery<LedgerInfo | null>(fetcher, {
    enabled,
    refetchInterval,
    initialData: null,
    debugLabel: "useLedgerInfo",
  });

  return {
    ledgerInfo: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  };
}
