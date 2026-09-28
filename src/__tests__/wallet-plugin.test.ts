/**
 * @file wallet-plugin.test.ts
 * @description Unit tests for custom wallet adapter plugins and registry.
 * @package stellar-hooks
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  defineWalletAdapter,
  defineWalletPlugin,
  registerWalletAdapter,
  unregisterWalletAdapter,
  getRegisteredWalletAdapters,
  clearWalletAdapterRegistry,
  resolveWalletAdapter,
  createAllAdapters,
  type WalletAdapter,
  type WalletAdapterPlugin,
} from "../wallets";

describe("Custom Wallet Adapter Plugin System", () => {
  beforeEach(() => {
    clearWalletAdapterRegistry();
  });

  const dummyAdapter: WalletAdapter = {
    id: "custom-stellar-wallet",
    name: "Custom Stellar Wallet",
    meta: {
      name: "Custom Stellar Wallet",
      description: "A test third party wallet adapter",
      iconUrl: "https://example.com/icon.png",
      installUrl: "https://example.com/install",
      supportsSignMessage: true,
      supportsSignAuthEntry: false,
    },
    isInstalled: () => true,
    connect: async () => "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    disconnect: () => {},
    signTransaction: async (xdr: string) => `signed-${xdr}`,
  };

  it("defines and resolves a wallet adapter", () => {
    const defined = defineWalletAdapter(dummyAdapter);
    expect(defined.id).toBe("custom-stellar-wallet");
    expect(resolveWalletAdapter(defined)).toBe(dummyAdapter);
  });

  it("defines and resolves a wallet adapter plugin", () => {
    const plugin: WalletAdapterPlugin = defineWalletPlugin({
      name: "custom-plugin",
      createAdapter: () => dummyAdapter,
    });

    const resolved = resolveWalletAdapter(plugin);
    expect(resolved.id).toBe("custom-stellar-wallet");
    expect(resolved.name).toBe("Custom Stellar Wallet");
  });

  it("registers and unregisters custom adapters in the global registry", () => {
    registerWalletAdapter(dummyAdapter);
    expect(getRegisteredWalletAdapters()).toHaveLength(1);
    expect(getRegisteredWalletAdapters()[0].id).toBe("custom-stellar-wallet");

    unregisterWalletAdapter("custom-stellar-wallet");
    expect(getRegisteredWalletAdapters()).toHaveLength(0);
  });

  it("integrates registered custom adapters into createAllAdapters()", () => {
    const initialAdapters = createAllAdapters();
    expect(initialAdapters.find((a) => a.id === "custom-stellar-wallet")).toBeUndefined();

    registerWalletAdapter(dummyAdapter);
    const updatedAdapters = createAllAdapters();
    const found = updatedAdapters.find((a) => a.id === "custom-stellar-wallet");
    expect(found).toBeDefined();
    expect(found?.name).toBe("Custom Stellar Wallet");
  });

  it("allows passing per-instance custom adapters to createAllAdapters()", () => {
    const adapters = createAllAdapters([dummyAdapter]);
    const found = adapters.find((a) => a.id === "custom-stellar-wallet");
    expect(found).toBeDefined();
  });
});
