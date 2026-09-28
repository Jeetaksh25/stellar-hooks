/**
 * @file deprecation.ts
 * @description Standardized deprecation warning utility with deduplication and migration guidance.
 * @package stellar-hooks
 * @license MIT
 */

const warnedFeatures = new Set<string>();

export interface WarnDeprecatedOptions {
  /** The target version where this deprecated feature will be permanently removed. */
  version?: string;
  /** Whether to warn only once per session (default: true). */
  once?: boolean;
}

/**
 * Logs a standardized deprecation warning to `console.warn` with migration instructions.
 * Deduplicates warnings by `feature` identifier to prevent flooding the console during React renders.
 *
 * @param feature - Unique identifier or description of the deprecated signature/option.
 * @param migration - Clear instruction on how to migrate to the modern alternative.
 * @param options - Optional configuration (e.g. removal version target).
 *
 * @example
 * ```ts
 * warnDeprecated(
 *   "useAccountMerge() legacy signature",
 *   "Pass { destination } to useAccountMerge and call submit(). See MIGRATION.md.",
 *   { version: "1.0.0" }
 * );
 * ```
 */
export function warnDeprecated(
  feature: string,
  migration: string,
  options?: WarnDeprecatedOptions
): void {
  const once = options?.once ?? true;
  if (once && warnedFeatures.has(feature)) {
    return;
  }

  warnedFeatures.add(feature);

  const removalText = options?.version
    ? ` and will be removed in v${options.version}`
    : " and will be removed in a future release";

  const message = `[stellar-hooks] Deprecation warning: "${feature}" is deprecated${removalText}. ${migration}`;

  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn(message);
  }
}

/**
 * Check whether a specific feature warning has been triggered.
 */
export function hasWarned(feature: string): boolean {
  return warnedFeatures.has(feature);
}

/**
 * Clear the internal set of warned features. Used primarily for unit tests.
 */
export function resetDeprecationWarnings(): void {
  warnedFeatures.clear();
}
