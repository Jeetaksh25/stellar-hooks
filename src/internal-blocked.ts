/**
 * @file src/internal-blocked.ts
 *
 * This module is the runtime target for the `./internal` and `./internal/*`
 * package-exports entries in `package.json`. It exists only to produce a
 * clear, actionable error message when a consumer attempts to import
 * stellar-hooks internal APIs at runtime.
 *
 * The Node.js / bundler package-exports map already prevents resolution of
 * `stellar-hooks/internal` in environments that respect the `exports` field.
 * This file is the last-resort guard for environments that do not.
 *
 * Consumers should import from the public entry points only:
 *   - `stellar-hooks`                   (all public React hooks and types)
 *   - `stellar-hooks/<hookName>`        (individual deep-import hooks)
 *   - `@stellar-hooks/core`             (framework-agnostic utilities)
 *
 * @package stellar-hooks
 * @license MIT
 */

throw new Error(
  "[stellar-hooks] You are importing from an internal path that is not part " +
    "of the public API. Internal utilities may change or be removed in any " +
    "release without a semver bump.\n\n" +
    "Import from 'stellar-hooks' or 'stellar-hooks/<hookName>' instead.\n" +
    "See: https://github.com/dark-princezz/stellar-hooks/blob/main/docs/guides/public-api-boundary.md",
);
