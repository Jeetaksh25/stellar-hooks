export type BuiltinWalletId = "freighter" | "lobstr" | "xbull" | "albedo" | "rabet" | "ledger" | "lobstr-wc";

export type WalletId = BuiltinWalletId | (string & {});

/**
 * Display metadata for a wallet — used to render wallet-picker UIs without
 * coupling UI code to wallet-specific knowledge.
 */
export interface WalletMeta {
  /** Human-readable wallet name (e.g. "Freighter"). */
  name: string;
  /** Short description of the wallet shown in picker UIs. */
  description: string;
  /**
   * URL to the wallet's icon (PNG/SVG).
   * Can be a remote HTTPS URL or a data-URI for inline SVGs.
   */
  iconUrl: string;
  /**
   * Deep-link or store URL for installing the wallet extension / app.
   * Display an "Install" CTA when `isInstalled()` returns false.
   */
  installUrl: string;
  /**
   * When `true`, `signMessage()` is implemented by this wallet.
   * Check before calling to show/hide message-signing UI.
   */
  supportsSignMessage: boolean;
  /**
   * When `true`, `signAuthEntry()` is implemented by this wallet.
   * Required for Soroban authorization entry flows.
   */
  supportsSignAuthEntry: boolean;
}

export interface WalletAdapter {
  id: WalletId;
  name: string;
  /** Display metadata for wallet-picker UIs. */
  meta: WalletMeta;
  isInstalled(): boolean;
  connect(): Promise<string>;
  disconnect(): void;
  signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string>;
  signMessage?(message: string, opts?: { accountToSign?: string }): Promise<string>;
  signAuthEntry?(entryPreimageXdr: string): Promise<string>;
}

/**
 * A wallet plugin that can create and configure a custom wallet adapter.
 */
export interface WalletAdapterPlugin {
  /** Unique name or ID of the wallet adapter plugin. */
  name: string;
  /** Creates and returns the wallet adapter instance. */
  createAdapter(): WalletAdapter;
}

/**
 * Accepted input type for custom wallet adapters: a ready adapter, a plugin, or a factory function.
 */
export type CustomWalletAdapterInput =
  | WalletAdapter
  | WalletAdapterPlugin
  | (() => WalletAdapter);

/** Helper to define and type-check a custom wallet adapter */
export function defineWalletAdapter(adapter: WalletAdapter): WalletAdapter {
  return adapter;
}

/** Helper to define and type-check a wallet adapter plugin */
export function defineWalletPlugin(plugin: WalletAdapterPlugin): WalletAdapterPlugin {
  return plugin;
}

/**
 * A wallet entry enriched with its detected installation status.
 * Used in the `wallets` array returned by `useWallet`.
 */
export interface WalletInfo {
  /** Stable wallet identifier. */
  id: WalletId;
  /** Human-readable wallet name. */
  name: string;
  /** Display metadata for rendering picker UIs. */
  meta: WalletMeta;
  /** Whether the wallet extension / app is currently available in this browser. */
  isInstalled: boolean;
}

