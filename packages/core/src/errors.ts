/**
 * @file errors.ts
 * @description Framework-agnostic Stellar error classes and error-code enum.
 *
 * These classes are shared between the React hooks layer and any future
 * framework bindings (Vue, Svelte, Node.js) that are built on
 * `@stellar-hooks/core`.
 *
 * @package @stellar-hooks/core
 * @license MIT
 */

// ─── Error code enum ─────────────────────────────────────────────────────────

/**
 * Numeric error codes for all errors thrown by stellar-hooks.
 *
 * Using a numeric enum ensures stability across package versions — string enum
 * member names can be renamed without being considered breaking.
 */
export enum ErrorCode {
  Unknown = 0,
  WalletNotInstalled = 1001,
  WalletNotConnected = 1002,
  UserRejected = 1003,
  NetworkError = 2001,
  SimulationError = 2002,
  TransactionFailed = 3001,
  TransactionTimeout = 3002,
}

/** The type of any `ErrorCode` value, for use in conditional types. */
export type ErrorCodeType = ErrorCode;

// ─── Base error class ─────────────────────────────────────────────────────────

/**
 * Base class for all stellar-hooks errors. Carries a typed `code` so
 * consumers can handle specific error cases with a switch/case rather than
 * `instanceof` chain.
 */
export class StellarHookError extends Error {
  readonly code: ErrorCode;

  constructor(message: string, code: ErrorCode, options?: ErrorOptions) {
    super(message, options);
    this.name = "StellarHookError";
    this.code = code;
  }
}

// ─── Concrete error classes ───────────────────────────────────────────────────

export interface WalletErrorOptions extends ErrorOptions {
  /** The wallet that produced this error. */
  walletId?: string;
  /** The signing or connection operation that failed. */
  operation?: string;
}

/** The user explicitly rejected the wallet popup (e.g. clicked "Decline"). */
export class UserRejectedError extends StellarHookError {
  readonly walletId: string | undefined;
  readonly operation: string | undefined;

  constructor(message: string, opts?: WalletErrorOptions) {
    super(message, ErrorCode.UserRejected, opts);
    this.name = "UserRejectedError";
    this.walletId = opts?.walletId;
    this.operation = opts?.operation;
  }
}

/** The required wallet extension is not installed in this browser. */
export class WalletNotInstalledError extends StellarHookError {
  readonly walletId: string | undefined;

  constructor(message: string, opts?: WalletErrorOptions) {
    super(message, ErrorCode.WalletNotInstalled, opts);
    this.name = "WalletNotInstalledError";
    this.walletId = opts?.walletId;
  }
}

/** The wallet is installed but the user has not connected (granted access). */
export class WalletNotConnectedError extends StellarHookError {
  readonly walletId: string | undefined;

  constructor(message: string, opts?: WalletErrorOptions) {
    super(message, ErrorCode.WalletNotConnected, opts);
    this.name = "WalletNotConnectedError";
    this.walletId = opts?.walletId;
  }
}

/** A Freighter-specific alias kept for backward compatibility. */
export class FreighterNotInstalledError extends WalletNotInstalledError {
  constructor(message = "Freighter extension is not installed.") {
    super(message, { walletId: "freighter" });
    this.name = "FreighterNotInstalledError";
  }
}

/** A Horizon or Soroban RPC call failed with a network-level error. */
export class NetworkError extends StellarHookError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, ErrorCode.NetworkError, options);
    this.name = "NetworkError";
  }
}

/** Soroban contract simulation failed (preflight error). */
export class SimulationError extends StellarHookError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, ErrorCode.SimulationError, options);
    this.name = "SimulationError";
  }
}

/** The submitted transaction failed on-ledger. */
export class TransactionFailedError extends StellarHookError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, ErrorCode.TransactionFailed, options);
    this.name = "TransactionFailedError";
  }
}

/** Polling for transaction confirmation timed out. */
export class TransactionTimeoutError extends StellarHookError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, ErrorCode.TransactionTimeout, options);
    this.name = "TransactionTimeoutError";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns `true` when a wallet-provided message string indicates the user
 * intentionally rejected the request (rather than an unexpected error).
 */
export function isUserRejectionMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("user rejected") ||
    lower.includes("user declined") ||
    lower.includes("user denied") ||
    lower.includes("rejected by user") ||
    lower.includes("cancelled by user") ||
    lower.includes("canceled by user")
  );
}
