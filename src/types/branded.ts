/**
 * Branded string types for Stellar identifiers.
 * Uses TypeScript's branding pattern for compile-time type safety
 * without any runtime overhead.
 */

// ─── Core Branding Utility ─────────────────────────────────────────────

/** Internal branding utility — never use directly */
type Brand<K, T> = K & { readonly __brand: T };

// ─── Amount Types ─────────────────────────────────────────────────────────────

/**
 * A whole-unit asset amount string with 7 decimal places.
 * Stellar balances are always expressed in this unit (e.g. `"100.0000000"` = 100 XLM).
 *
 * Use this wherever a balance, send amount, or receive amount is displayed to the user
 * or passed to Horizon / Soroban APIs that accept whole-unit values.
 *
 * @example
 * ```ts
 * const xlm: WholeUnitAmount = asWholeUnitAmount("100.0000000");
 * const usdc: WholeUnitAmount = asWholeUnitAmount("25.5000000");
 * ```
 */
export type WholeUnitAmount = Brand<string, "WholeUnitAmount">;

/**
 * A stroop-denominated amount string (1 XLM = 10,000,000 stroops).
 * Used for transaction fees and certain Soroban API parameters.
 *
 * @example
 * ```ts
 * const fee: StroopAmount = asStroopAmount("100"); // 100 stroops = 0.00001 XLM
 * ```
 */
export type StroopAmount = Brand<string, "StroopAmount">;

/**
 * Union of the two amount units. Use this when a field may hold either
 * whole-unit or stroop values, forcing callers to narrow via the brand.
 */
export type Amount = WholeUnitAmount | StroopAmount;

// ─── Validation Patterns for Amounts ──────────────────────────────────────────

/** Matches Stellar whole-unit format: up to 13 integer digits, exactly 7 decimal places. */
const WHOLE_UNIT_REGEX = /^\d{1,13}(\.\d{1,7})?$/;
/** Matches a stroop integer (non-negative whole number). */
const STROOP_REGEX = /^\d+$/;

/**
 * Validates and brands a string as a whole-unit Stellar amount.
 * @throws {Error} if the string is not a valid whole-unit amount
 */
export function asWholeUnitAmount(value: string): WholeUnitAmount {
  if (!WHOLE_UNIT_REGEX.test(value)) {
    throw new Error(
      `Invalid whole-unit amount: "${value}". Expected up to 7 decimal places (e.g. "100.0000000").`
    );
  }
  return value as WholeUnitAmount;
}

/**
 * Validates and brands a string as a stroop amount.
 * @throws {Error} if the string is not a valid non-negative integer
 */
export function asStroopAmount(value: string): StroopAmount {
  if (!STROOP_REGEX.test(value)) {
    throw new Error(
      `Invalid stroop amount: "${value}". Expected a non-negative integer string.`
    );
  }
  return value as StroopAmount;
}

/**
 * UNSAFE: Cast a string to WholeUnitAmount without validation.
 * Only use when you're 100% sure the value came from a trusted Horizon/Soroban response.
 */
export function unsafeAsWholeUnitAmount(value: string): WholeUnitAmount {
  return value as WholeUnitAmount;
}

/**
 * UNSAFE: Cast a string to StroopAmount without validation.
 * Only use when you're 100% sure the value is in stroops.
 */
export function unsafeAsStroopAmount(value: string): StroopAmount {
  return value as StroopAmount;
}

// ─── Branded Types ───────────────────────────────────────────────────────

/**
 * A Stellar account public key (G-prefixed strkey, 56 chars)
 *
 * @example
 * ```ts
 * const key: StellarPublicKey = asPublicKey("GABC...XYZ");
 * ```
 */
export type StellarPublicKey = Brand<string, "StellarPublicKey">;

/**
 * A Soroban smart contract ID (C-prefixed strkey, 56 chars)
 *
 * @example
 * ```ts
 * const id: StellarContractId = asContractId("CABC...XYZ");
 * ```
 */
export type StellarContractId = Brand<string, "StellarContractId">;

/**
 * A base64-encoded XDR string
 *
 * @example
 * ```ts
 * const xdr: StellarXdrString = asXdrString(transaction.toXDR());
 * ```
 */
export type StellarXdrString = Brand<string, "StellarXdrString">;

/**
 * A Stellar transaction hash (hex string, 64 chars)
 *
 * @example
 * ```ts
 * const hash: StellarTxHash = asTxHash("a1b2c3d4..."); // 64-char hex
 * ```
 */
export type StellarTxHash = Brand<string, "StellarTxHash">;

/**
 * A Stellar asset issuer public key (G-prefixed strkey)
 *
 * @example
 * ```ts
 * const issuer: StellarAssetIssuer = asAssetIssuer("GABC...XYZ");
 * ```
 */
export type StellarAssetIssuer = Brand<string, "StellarAssetIssuer">;

// ─── Validation Patterns ─────────────────────────────────────────────────

const PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;
const CONTRACT_ID_REGEX = /^C[A-Z2-7]{55}$/;
const XDR_REGEX = /^[A-Za-z0-9+/]*={0,2}$/;
const TX_HASH_REGEX = /^[a-f0-9]{64}$/;

// ─── Factory Functions ───────────────────────────────────────────────────

/**
 * Validates and brands a string as a Stellar public key.
 * @throws {Error} if the string is not a valid G-prefixed strkey
 */
export function asPublicKey(value: string): StellarPublicKey {
  if (!PUBLIC_KEY_REGEX.test(value)) {
    throw new Error(
      `Invalid Stellar public key: "${value}". Expected G-prefixed strkey (56 chars).`
    );
  }
  return value as StellarPublicKey;
}

/**
 * Validates and brands a string as a Soroban contract ID.
 * @throws {Error} if the string is not a valid C-prefixed strkey
 */
export function asContractId(value: string): StellarContractId {
  if (!CONTRACT_ID_REGEX.test(value)) {
    throw new Error(
      `Invalid Stellar contract ID: "${value}". Expected C-prefixed strkey (56 chars).`
    );
  }
  return value as StellarContractId;
}

/**
 * Validates and brands a string as a base64-encoded XDR string.
 * @throws {Error} if the string is not valid base64
 */
export function asXdrString(value: string): StellarXdrString {
  if (!XDR_REGEX.test(value) || value.length % 4 !== 0) {
    throw new Error(
      `Invalid XDR string: not valid base64.`
    );
  }
  return value as StellarXdrString;
}

/**
 * Validates and brands a string as a Stellar transaction hash.
 * @throws {Error} if the string is not a valid 64-char hex string
 */
export function asTxHash(value: string): StellarTxHash {
  if (!TX_HASH_REGEX.test(value)) {
    throw new Error(
      `Invalid transaction hash: "${value}". Expected 64-character hex string.`
    );
  }
  return value as StellarTxHash;
}

/**
 * Validates and brands a string as a Stellar asset issuer.
 * Alias for asPublicKey — asset issuers are also G-prefixed strkeys.
 */
export function asAssetIssuer(value: string): StellarAssetIssuer {
  return asPublicKey(value) as unknown as StellarAssetIssuer;
}

// ─── Unsafe Casting (use sparingly) ────────────────────────────────────

/**
 * UNSAFE: Cast a string to StellarPublicKey without validation.
 * Only use when you're 100% sure the value is valid (e.g., from a trusted API).
 */
export function unsafeAsPublicKey(value: string): StellarPublicKey {
  return value as StellarPublicKey;
}

/**
 * UNSAFE: Cast a string to StellarContractId without validation.
 * Only use when you're 100% sure the value is valid (e.g., from a trusted API).
 */
export function unsafeAsContractId(value: string): StellarContractId {
  return value as StellarContractId;
}

/**
 * UNSAFE: Cast a string to StellarXdrString without validation.
 * Only use when you're 100% sure the value is valid (e.g., from a trusted API).
 */
export function unsafeAsXdrString(value: string): StellarXdrString {
  return value as StellarXdrString;
}

/**
 * UNSAFE: Cast a string to StellarTxHash without validation.
 * Only use when you're 100% sure the value is valid (e.g., from a trusted API).
 */
export function unsafeAsTxHash(value: string): StellarTxHash {
  return value as StellarTxHash;
}

/**
 * UNSAFE: Cast a string to StellarAssetIssuer without validation.
 * Only use when you're 100% sure the value is valid (e.g., from a trusted API).
 */
export function unsafeAsAssetIssuer(value: string): StellarAssetIssuer {
  return value as unknown as StellarAssetIssuer;
}