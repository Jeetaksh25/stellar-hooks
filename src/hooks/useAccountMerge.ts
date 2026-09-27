/**
 * @file useAccountMerge.ts
 * @description Hook for merging a Stellar account into a destination account.
 * @package stellar-hooks
 * @license MIT
 */

import { useCallback } from "react";
import {
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useStellarContext } from "../context";
import { useFreighter } from "./useFreighter";
import { useTransactionCore } from "./useTransactionCore";
import { unsafeAsXdrString, type TransactionStatus, type StellarTransactionError } from "../types";
import { warnDeprecated } from "../utils/deprecation";

export interface UseAccountMergeOptions {
  /** Destination Stellar address that will receive the merged account's balance. */
  destination?: string;
  /** Optional memo text (max 28 bytes) attached to the merge transaction. */
  memo?: string;
  /** Fee in stroops. Default: 100 */
  fee?: number;
  /** Polling timeout in seconds. Default: 60 */
  timeoutSeconds?: number;
  /**
   * @deprecated The `confirm` option is deprecated and will be removed in v1.0.0.
   */
  confirm?: boolean;
  /** Callback fired when the transaction is successfully confirmed. */
  onSuccess?: (hash: string) => void;
  /** Callback fired when the transaction fails or an error occurs. */
  onError?: (error: StellarTransactionError) => void;
}

export interface UseAccountMergeReturn {
  /** Build, sign, and submit the account merge. */
  submit: () => Promise<void>;
  /**
   * @deprecated `merge(destination, opts)` is deprecated and will be removed in v1.0.0.
   * Please pass `{ destination }` to `useAccountMerge` and call `submit()` instead.
   * See https://github.com/dark-princezz/stellar-hooks/blob/main/MIGRATION.md#useaccountmerge--migrated-to-options--submit-convention
   */
  merge: (
    destination?: string,
    opts?: { confirm?: boolean; memo?: string; fee?: number; timeoutSeconds?: number }
  ) => Promise<void>;
  status: TransactionStatus;
  hash: string | null;
  error: StellarTransactionError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
}

/**
 * Merge the connected account into `destination`, permanently closing the
 * source account and transferring its entire XLM balance. This operation is
 * irreversible — the source account ceases to exist on-ledger once the
 * transaction succeeds.
 *
 * @example
 * ```tsx
 * const { submit, status, hash, error } = useAccountMerge({
 *   destination: "GDEST...",
 * });
 *
 * await submit();
 * ```
 */
export function useAccountMerge(
  options?: UseAccountMergeOptions
): UseAccountMergeReturn {
  if (!options || !options.destination) {
    warnDeprecated(
      "useAccountMerge() without destination option",
      "Calling useAccountMerge() without options is deprecated. Pass { destination } to useAccountMerge and call submit(). See MIGRATION.md.",
      { version: "1.0.0" }
    );
  }

  if (options && "confirm" in options) {
    warnDeprecated(
      "useAccountMerge({ confirm })",
      "The 'confirm' option in useAccountMerge is deprecated. Confirmation must be handled in UI before calling submit(). See MIGRATION.md.",
      { version: "1.0.0" }
    );
  }

  const destination = options?.destination ?? "";
  const memo = options?.memo;
  const fee = options?.fee ?? 100;
  const timeoutSeconds = options?.timeoutSeconds ?? 60;
  const onSuccess = options?.onSuccess;
  const onError = options?.onError;
  const { config } = useStellarContext();
  const { publicKey, signTransaction } = useFreighter();
  const { submit: submitXdr, reset, ...txState } = useTransactionCore({
    mode: "classic",
    ...(onSuccess && { onSuccess }),
    debugLabel: "useAccountMerge",
    ...(onError && { onError }),
  });


  const submit = useCallback(async () => {
    if (!publicKey) {
      throw new Error("Freighter is not connected. Call connect() first.");
    }

    const server = new Horizon.Server(config.horizonUrl);
    const sourceAccount = await server.loadAccount(publicKey);

    const builder = new TransactionBuilder(sourceAccount, {
      fee: String(fee),
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(Operation.accountMerge({ destination }))
      .setTimeout(timeoutSeconds);

    if (memo) {
      builder.addMemo(Memo.text(memo));
    }

    const builtTx = builder.build();
    const builtXdr = builtTx.toXDR();

    const signedXdr = await signTransaction(unsafeAsXdrString(builtXdr), {
      networkPassphrase: config.networkPassphrase,
    });

    await submitXdr(signedXdr);
  }, [destination, memo, fee, timeoutSeconds, config, publicKey, signTransaction, submitXdr]);

  const merge = useCallback(
    async (
      targetDestination?: string,
      legacyOpts?: { confirm?: boolean; memo?: string; fee?: number; timeoutSeconds?: number }
    ) => {
      warnDeprecated(
        "merge(destination, opts)",
        "Calling merge() is deprecated. Pass { destination } to useAccountMerge and call submit(). See MIGRATION.md.",
        { version: "1.0.0" }
      );
      if (legacyOpts?.confirm !== undefined) {
        warnDeprecated(
          "merge(_, { confirm })",
          "The 'confirm' option in merge() is deprecated. Handle confirmation before calling submit(). See MIGRATION.md.",
          { version: "1.0.0" }
        );
      }

      const effectiveDest = targetDestination ?? destination;
      if (!effectiveDest) {
        throw new Error("No destination specified for accountMerge.");
      }
      if (!publicKey) {
        throw new Error("Freighter is not connected. Call connect() first.");
      }

      const effectiveFee = legacyOpts?.fee ?? fee;
      const effectiveTimeout = legacyOpts?.timeoutSeconds ?? timeoutSeconds;
      const effectiveMemo = legacyOpts?.memo ?? memo;

      const server = new Horizon.Server(config.horizonUrl);
      const sourceAccount = await server.loadAccount(publicKey);

      const builder = new TransactionBuilder(sourceAccount, {
        fee: String(effectiveFee),
        networkPassphrase: config.networkPassphrase,
      })
        .addOperation(Operation.accountMerge({ destination: effectiveDest }))
        .setTimeout(effectiveTimeout);

      if (effectiveMemo) {
        builder.addMemo(Memo.text(effectiveMemo));
      }

      const builtTx = builder.build();
      const builtXdr = builtTx.toXDR();

      const signedXdr = await signTransaction(unsafeAsXdrString(builtXdr), {
        networkPassphrase: config.networkPassphrase,
      });

      await submitXdr(signedXdr);
    },
    [destination, memo, fee, timeoutSeconds, config, publicKey, signTransaction, submitXdr]
  );

  return {
    submit,
    merge,
    reset,
    status: txState.status,
    hash: txState.hash,
    error: txState.error,
    isLoading: txState.isLoading,
    isSuccess: txState.isSuccess,
    isError: txState.isError,
  };
}
