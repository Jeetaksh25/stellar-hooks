/**
 * @file storageAdapter.ts
 * @description Pluggable storage interface for persisted state (network selection, custom config, etc.).
 * Abstracts `localStorage` behind an async-compatible interface so React Native consumers
 * can supply `AsyncStorage` (or any other storage backend) without forking the library.
 *
 * Issue: #840 — Replace localStorage usage with a pluggable storage adapter
 *
 * @package stellar-hooks
 * @license MIT
 */

/**
 * Minimal async-compatible storage interface.
 * Mirrors the subset of the Web Storage API (and `@react-native-async-storage/async-storage`)
 * that stellar-hooks requires:
 *
 * ```ts
 * // Web (default — wraps localStorage)
 * const adapter = createLocalStorageAdapter();
 *
 * // React Native
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 * const adapter = createAsyncStorageAdapter(AsyncStorage);
 *
 * // Custom
 * const adapter: StorageAdapter = {
 *   getItem: (key) => myStore.get(key),
 *   setItem: (key, value) => myStore.set(key, value),
 *   removeItem: (key) => myStore.delete(key),
 * };
 * ```
 */
export interface StorageAdapter {
  /**
   * Returns the value for `key`, or `null` when absent.
   * May be synchronous or asynchronous.
   */
  getItem(key: string): string | null | Promise<string | null>;
  /**
   * Persists `value` under `key`.
   * May be synchronous or asynchronous.
   */
  setItem(key: string, value: string): void | Promise<void>;
  /**
   * Removes the entry for `key`.
   * May be synchronous or asynchronous.
   */
  removeItem(key: string): void | Promise<void>;
}

// ─── Built-in adapters ────────────────────────────────────────────────────────

/**
 * Creates a storage adapter backed by the browser's `localStorage`.
 * This is the default adapter used by `<StellarProvider>`.
 *
 * In environments where `localStorage` is not available (e.g. server-side rendering)
 * the adapter silently no-ops, which is identical to the previous behaviour.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      if (typeof localStorage === "undefined") return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      if (typeof localStorage === "undefined") return;
      try {
        localStorage.setItem(key, value);
      } catch {
        /* quota exceeded or private-browsing restrictions — silently ignore */
      }
    },
    removeItem(key: string): void {
      if (typeof localStorage === "undefined") return;
      try {
        localStorage.removeItem(key);
      } catch {
        /* silently ignore */
      }
    },
  };
}

/**
 * Creates a no-op storage adapter that never persists anything.
 * Useful for server-side rendering, unit tests, or explicitly disabling persistence.
 *
 * @example
 * ```tsx
 * import { createNullStorageAdapter } from "stellar-hooks";
 *
 * <StellarProvider network="testnet" storageAdapter={createNullStorageAdapter()}>
 *   <App />
 * </StellarProvider>
 * ```
 */
export function createNullStorageAdapter(): StorageAdapter {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

/**
 * Wraps an object whose API matches `@react-native-async-storage/async-storage`
 * into a `StorageAdapter`.
 *
 * The AsyncStorage API returns Promises; this adapter wraps those promises
 * and normalises `undefined` returns to `null` so they match the `StorageAdapter`
 * contract.
 *
 * @example
 * ```tsx
 * import AsyncStorage from "@react-native-async-storage/async-storage";
 * import { createAsyncStorageAdapter, StellarProvider } from "stellar-hooks";
 *
 * const storageAdapter = createAsyncStorageAdapter(AsyncStorage);
 *
 * export default function App() {
 *   return (
 *     <StellarProvider network="testnet" storageAdapter={storageAdapter}>
 *       <MyApp />
 *     </StellarProvider>
 *   );
 * }
 * ```
 */
export function createAsyncStorageAdapter(asyncStorage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}): StorageAdapter {
  return {
    getItem: (key: string) =>
      asyncStorage.getItem(key).catch(() => null),
    setItem: (key: string, value: string) =>
      asyncStorage.setItem(key, value).catch(() => {}),
    removeItem: (key: string) =>
      asyncStorage.removeItem(key).catch(() => {}),
  };
}

// ─── Internal helper ─────────────────────────────────────────────────────────

/**
 * Normalises the synchronous-or-async return value of a storage adapter read
 * into a `Promise<string | null>`.
 *
 * @internal
 */
export async function resolveStorageItem(
  adapter: StorageAdapter,
  key: string,
): Promise<string | null> {
  const result = adapter.getItem(key);
  if (result instanceof Promise) {
    return result.catch(() => null);
  }
  return result;
}
