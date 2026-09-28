/**
 * @file useBatchTrustline.ts
 * @description Hook for adding, updating, or removing multiple Stellar trustlines in a single atomic transaction.
 *              Ideal for onboarding flows that pre-configure supported assets.
 * @package stellar-hooks
 * @license MIT
 */

import { useCallback } from "react";
import {
  Asset,
  Horizon,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useStellarContext } from "../context";
import { useTransactionCore } from "./useTransactionCore";
import { useWallet } from "./useWallet";
import { useFreighter } from "./useFreighter";
import { useStellarAccount } from "./useStellarAccount";
import type {
  TransactionStatus,
  StellarBalance,
  StellarTransactionError,
  OnBeforeSubmitCallback,
  OnAfterSubmitCallback,
} from "../types";
import { unsafeAsXdrString } from "../types";
import { validatePublicKey } from "../utils";
import type { WalletId } from "../wallets/types";
import type { TransactionMiddleware } from "../middleware";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * An asset definition for batch trustline operations.
 */
export interface BatchTrustlineAsset {
  /** Asset code (e.g. "USDC", "EURT") */
  code: string;
  /** Asset issuer public key (G...) */
  issuer: string;
  /**
   * Trustline limit. Defaults to max (no limit) if omitted.
   * Set to "0" to remove the trustline entirely.
   */
  limit?: string;
}

export interface UseBatchTrustlineOptions {
  /** Account public key to query trustlines for. Defaults to connected wallet key if not provided. */
  publicKey?: string;
  /** Account public key alias */
  account?: string;
  /** Initial array of assets to establish trustlines for. */
  assets?: BatchTrustlineAsset[];
  /** Total transaction fee in stroops. Defaults to 100 * number of operations. */
  fee?: number;
  /** Polling timeout in seconds. Default: 60 */
  timeoutSeconds?: number;
  /** Optional wallet ID to sign with. Default: active wallet or freighter */
  walletId?: WalletId;
  /** Additional transaction middleware to execute for this hook instance */
  middleware?: TransactionMiddleware[];
  /** Callback fired before transaction submission. Return false to abort submission. */
  onBeforeSubmit?: OnBeforeSubmitCallback;
  /** Callback fired after transaction submission finishes or fails. */
  onAfterSubmit?: OnAfterSubmitCallback;
  /** Callback fired when the transaction is successfully confirmed. */
  onSuccess?: (hash: string) => void;
  /** Callback fired when the transaction fails or an error occurs. */
  onError?: (error: StellarTransactionError) => void;
}

export interface UseBatchTrustlineReturn {
  /**
   * Builds, signs, and submits a single transaction containing changeTrust operations
   * for each configured asset (or passed override assets).
   */
  submit: (overrideAssets?: BatchTrustlineAsset[]) => Promise<void>;
  /** Alias for submit with explicit assets parameter. */
  setTrustlines: (assets: BatchTrustlineAsset[]) => Promise<void>;
  /** Array of current non-native trustlines for the target account */
  trustlines: StellarBalance[];
  status: TransactionStatus;
  hash: string | null;
  error: StellarTransactionError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  reset: () => void;
  refetch?: () => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook for setting up multiple trustlines in a single atomic transaction.
 *
 * @example
 * ```tsx
 * const { submit, status, isLoading, isSuccess } = useBatchTrustline({
 *   assets: [
 *     { code: "USDC", issuer: "GA5Z..." },
 *     { code: "AQUA", issuer: "GBNZ..." },
 *   ],
 *   onSuccess: (hash) => console.log("Batch trustlines created:", hash),
 * });
 *
 * return <button onClick={() => submit()} disabled={isLoading}>Setup Assets</button>;
 * ```
 */
export function useBatchTrustline(
  options: UseBatchTrustlineOptions = {}
): UseBatchTrustlineReturn {
  const {
    publicKey: optionPublicKey,
    account: optionAccount,
    assets: defaultAssets,
    fee,
    timeoutSeconds = 60,
    walletId,
    middleware,
    onBeforeSubmit,
    onAfterSubmit,
    onSuccess,
    onError,
  } = options;

  const { config } = useStellarContext();
  const freighter = useFreighter();
  const wallet = useWallet(walletId ? { walletId } : undefined);

  const signerPublicKey = wallet.publicKey ?? freighter.publicKey;
  const targetPublicKey = optionPublicKey || optionAccount || signerPublicKey;

  const { submit: submitXdr, reset, ...txState } = useTransactionCore({
    mode: "classic",
    timeoutSeconds,
    debugLabel: "useBatchTrustline",
    middleware,
    onBeforeSubmit,
    onAfterSubmit,
    ...(onSuccess && { onSuccess }),
    ...(onError && { onError }),
  });

  const { data: accountData, refetch } = useStellarAccount(targetPublicKey ?? undefined);
  const trustlines = (accountData?.balances ?? []).filter((b) => !b.isNative);

  const submit = useCallback(
    async (overrideAssets?: BatchTrustlineAsset[]) => {
      const activeAssets = overrideAssets ?? defaultAssets ?? [];

      if (activeAssets.length === 0) {
        throw new Error("At least one asset is required for batch trustline setup.");
      }

      if (!signerPublicKey) {
        throw new Error("Wallet is not connected. Call connect() first.");
      }

      // Validate all assets before building
      for (const a of activeAssets) {
        if (!a.code || typeof a.code !== "string") {
          throw new Error("Invalid asset code in batch trustlines.");
        }
        validatePublicKey(a.issuer, `asset.issuer (${a.code})`);
      }

      // 1. Load source account from Horizon for sequence number
      const server = new Horizon.Server(config.horizonUrl);
      const sourceAccount = await server.loadAccount(signerPublicKey);

      // 2. Base fee: default 100 stroops per operation
      const totalFee = fee ?? (100 * activeAssets.length);

      // 3. Build single transaction containing all changeTrust operations
      const builder = new TransactionBuilder(sourceAccount, {
        fee: String(totalFee),
        networkPassphrase: config.networkPassphrase,
      }).setTimeout(timeoutSeconds);

      for (const a of activeAssets) {
        const asset = new Asset(a.code, a.issuer);
        builder.addOperation(
          Operation.changeTrust({
            asset,
            ...(a.limit !== undefined && { limit: a.limit }),
          })
        );
      }

      const builtTx = builder.build();
      const builtXdr = builtTx.toXDR();

      // 4. Sign via active wallet or Freighter
      let signedXdr: string;
      if (wallet.isConnected) {
        signedXdr = await wallet.signTransaction(builtXdr, {
          networkPassphrase: config.networkPassphrase,
        });
      } else {
        signedXdr = await freighter.signTransaction(unsafeAsXdrString(builtXdr), {
          networkPassphrase: config.networkPassphrase,
        });
      }

      // 5. Submit and poll via useTransactionCore
      await submitXdr(unsafeAsXdrString(signedXdr));

      if (refetch) {
        await refetch();
      }
    },
    [
      defaultAssets,
      signerPublicKey,
      config.horizonUrl,
      config.networkPassphrase,
      fee,
      timeoutSeconds,
      wallet,
      freighter,
      submitXdr,
      refetch,
    ]
  );

  const setTrustlines = useCallback(
    async (assets: BatchTrustlineAsset[]) => {
      return submit(assets);
    },
    [submit]
  );

  return {
    submit,
    setTrustlines,
    trustlines,
    reset,
    refetch,
    status: txState.status,
    hash: txState.hash,
    error: txState.error,
    isLoading: txState.isLoading,
    isSuccess: txState.isSuccess,
    isError: txState.isError,
  };
}
