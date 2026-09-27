export type {
  BuiltinWalletId,
  WalletId,
  WalletAdapter,
  WalletMeta,
  WalletInfo,
  WalletAdapterPlugin,
  CustomWalletAdapterInput,
} from "./types";
export { defineWalletAdapter, defineWalletPlugin } from "./types";
export {
  registerWalletAdapter,
  unregisterWalletAdapter,
  getRegisteredWalletAdapters,
  clearWalletAdapterRegistry,
  resolveWalletAdapter,
} from "./registry";
export { createFreighterAdapter, isFreighterInstalled } from "./freighter";
export { createLobstrAdapter, createLobstrWalletConnectAdapter } from "./lobstr";
export { createXBullAdapter, createXBullWalletConnectAdapter, isXBullInstalled } from "./xbull";
export { createAlbedoAdapter, isAlbedoInstalled } from "./albedo";
export { createRabetAdapter } from "./rabet";
export { createLedgerAdapter } from "./ledger";
export {
  supportsTransactionSigning,
  supportsMessageSigning,
  supportsAuthEntrySigning,
  getWalletsWithCapability,
} from "./capabilities";

import type { WalletAdapter, CustomWalletAdapterInput } from "./types";
import { getRegisteredWalletAdapters, resolveWalletAdapter } from "./registry";
import { createFreighterAdapter } from "./freighter";
import { createLobstrAdapter } from "./lobstr";
import { createLobstrWalletConnectAdapter } from "./lobstr-walletconnect";
import { createXBullAdapter } from "./xbull";
import { createXBullWalletConnectAdapter } from "./xbull-walletconnect";
import { createAlbedoAdapter } from "./albedo";
import { createRabetAdapter } from "./rabet";
import { createLedgerAdapter } from "./ledger";

export function createAllAdapters(customAdapters?: CustomWalletAdapterInput[]): WalletAdapter[] {
  const builtIn: WalletAdapter[] = [
    createFreighterAdapter(),
    createLobstrAdapter(),
    createLobstrWalletConnectAdapter({ projectId: "stub-project-id" }),
    createXBullAdapter(),
    createXBullWalletConnectAdapter({ projectId: "stub-project-id" }),
    createAlbedoAdapter(),
    createRabetAdapter(),
    createLedgerAdapter(),
  ];

  const registered = getRegisteredWalletAdapters();
  const additional = (customAdapters ?? []).map(resolveWalletAdapter);

  // Merge built-in, registered, and extra adapters, deduplicating by ID (later entries override earlier)
  const adapterMap = new Map<string, WalletAdapter>();
  for (const a of builtIn) {
    adapterMap.set(a.id, a);
  }
  for (const a of registered) {
    adapterMap.set(a.id, a);
  }
  for (const a of additional) {
    adapterMap.set(a.id, a);
  }

  return Array.from(adapterMap.values());
}

