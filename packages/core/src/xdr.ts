/**
 * @file xdr.ts
 * @description Framework-agnostic XDR decoding helpers.
 *
 * These utilities can be used in Node.js scripts, server-side code, and any
 * future non-React bindings that need to inspect Stellar XDR values.
 *
 * @package @stellar-hooks/core
 * @license MIT
 */

import { xdr } from "@stellar/stellar-sdk";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The detected type of an XDR blob. */
export type XdrType =
  | "TransactionEnvelope"
  | "TransactionResult"
  | "TransactionMeta"
  | "LedgerEntry"
  | "ScVal"
  | "Unknown";

/** Result returned by {@link decodeXdr}. */
export interface XdrDecodeResult {
  type: XdrType;
  /** Human-readable JSON representation of the decoded value. */
  decoded: unknown;
  /** The raw base64 XDR string that was decoded. */
  raw: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Attempts to detect the XDR type of a base64-encoded XDR string by trying
 * multiple decoders in order of likelihood.
 */
export function detectXdrType(base64Xdr: string): XdrType {
  const tryDecode = <T>(fn: (b: Buffer) => T): boolean => {
    try {
      fn(Buffer.from(base64Xdr, "base64"));
      return true;
    } catch {
      return false;
    }
  };

  if (tryDecode((b) => xdr.TransactionEnvelope.fromXDR(b))) return "TransactionEnvelope";
  if (tryDecode((b) => xdr.TransactionResult.fromXDR(b))) return "TransactionResult";
  if (tryDecode((b) => xdr.TransactionMeta.fromXDR(b))) return "TransactionMeta";
  if (tryDecode((b) => xdr.LedgerEntry.fromXDR(b))) return "LedgerEntry";
  if (tryDecode((b) => xdr.ScVal.fromXDR(b))) return "ScVal";

  return "Unknown";
}

/**
 * Decodes a base64-encoded XDR blob into a human-readable JSON object.
 * The `type` field tells you which XDR schema was used for decoding.
 *
 * @example
 * ```ts
 * import { decodeXdr } from "@stellar-hooks/core/xdr";
 *
 * const result = decodeXdr(envelopeXdrString);
 * // result.type === "TransactionEnvelope"
 * // result.decoded === { ... }
 * ```
 */
export function decodeXdr(base64Xdr: string): XdrDecodeResult {
  const buf = Buffer.from(base64Xdr, "base64");
  const decoders: Array<[XdrType, () => unknown]> = [
    ["TransactionEnvelope", () => xdr.TransactionEnvelope.fromXDR(buf).toXDR("base64")],
    ["TransactionResult", () => xdr.TransactionResult.fromXDR(buf).toXDR("base64")],
    ["TransactionMeta", () => xdr.TransactionMeta.fromXDR(buf).toXDR("base64")],
    ["LedgerEntry", () => xdr.LedgerEntry.fromXDR(buf).toXDR("base64")],
    ["ScVal", () => xdr.ScVal.fromXDR(buf).toXDR("base64")],
  ];

  for (const [type, decode] of decoders) {
    try {
      return { type, decoded: decode(), raw: base64Xdr };
    } catch {
      // try the next decoder
    }
  }

  return { type: "Unknown", decoded: null, raw: base64Xdr };
}

/**
 * Formats an `XdrDecodeResult` as a human-readable string for logging or
 * display purposes.
 */
export function formatXdrResult(result: XdrDecodeResult): string {
  return `[${result.type}] ${JSON.stringify(result.decoded, null, 2)}`;
}
