/**
 * @file registry.ts
 * @description Plugin registry for custom third-party Stellar wallet adapters.
 * @package stellar-hooks
 * @license MIT
 */

import type { WalletAdapter, CustomWalletAdapterInput } from "./types";

const registeredAdapters: WalletAdapter[] = [];

/**
 * Resolves a `CustomWalletAdapterInput` (which may be an adapter, plugin, or factory function)
 * into a concrete `WalletAdapter` instance.
 */
export function resolveWalletAdapter(input: CustomWalletAdapterInput): WalletAdapter {
  if (typeof input === "function") {
    return input();
  }
  if ("createAdapter" in input && typeof input.createAdapter === "function") {
    return input.createAdapter();
  }
  return input;
}

/**
 * Register a custom third-party wallet adapter or plugin globally.
 * Registered adapters will automatically be recognized by `useWallet` and `createAllAdapters`.
 *
 * @param input - The custom wallet adapter, plugin, or factory function to register.
 */
export function registerWalletAdapter(input: CustomWalletAdapterInput): void {
  const adapter = resolveWalletAdapter(input);
  const existingIndex = registeredAdapters.findIndex((a) => a.id === adapter.id);
  if (existingIndex >= 0) {
    registeredAdapters[existingIndex] = adapter;
  } else {
    registeredAdapters.push(adapter);
  }
}

/**
 * Unregisters a previously registered custom wallet adapter by its wallet ID.
 *
 * @param id - The ID of the wallet adapter to remove.
 */
export function unregisterWalletAdapter(id: string): void {
  const index = registeredAdapters.findIndex((a) => a.id === id);
  if (index >= 0) {
    registeredAdapters.splice(index, 1);
  }
}

/**
 * Returns a copy of all globally registered custom wallet adapters.
 */
export function getRegisteredWalletAdapters(): WalletAdapter[] {
  return [...registeredAdapters];
}

/**
 * Clears the registry of all custom wallet adapters (useful for testing).
 */
export function clearWalletAdapterRegistry(): void {
  registeredAdapters.length = 0;
}
