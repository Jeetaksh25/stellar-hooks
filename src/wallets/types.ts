export type BuiltinWalletId = "freighter" | "lobstr" | "xbull" | "albedo" | "rabet" | "ledger" | "lobstr-wc";

export type WalletId = BuiltinWalletId | (string & {});

// ─── Disconnected-state discriminant ─────────────────────────────────────────

/**
 * The wallet is not connected. `publicKey` is `null` and no signing operations
 * are available. Callers must check `isConnected` before accessing wallet
 * capabilities to avoid implicit-undefined runtime errors.
 *
 * This type is part of the strict-null audit required by issue #832.
 */
export interface DisconnectedWalletState {
  readonly isConnected: false;
  /** Always `null` when the wallet is not connected. */
  readonly publicKey: null;
  /** Always `null` when the wallet is not connected. */
  readonly networkPassphrase: null;
}

/**
 * The wallet is connected. `publicKey` is guaranteed non-null.
 */
export interface ConnectedWalletState {
  readonly isConnected: true;
  /** The Stellar public key (G…) of the connected account. */
  readonly publicKey: string;
  /** The active network passphrase reported by the wallet, or `null` if the
   *  wallet does not expose it. */
  readonly networkPassphrase: string | null;
}

/**
 * Discriminated union of connected / disconnected wallet state.
 * Use this type (rather than `{ publicKey?: string | null }`) whenever you
 * need to express that a wallet may or may not be connected, to force callers
 * to handle the disconnected branch explicitly.
 *
 * @example
 * ```ts
 * function handleState(state: WalletConnectionState) {
 *   if (!state.isConnected) {
 *     // state.publicKey is null here — TypeScript enforces this
 *     return;
 *   }
 *   // state.publicKey is string here
 *   console.log(state.publicKey.slice(0, 8));
 * }
 * ```
 */
export type WalletConnectionState = DisconnectedWalletState | ConnectedWalletState;

// ─── Display metadata ─────────────────────────────────────────────────────────

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

// ─── Wallet adapter ──────────────────────────────────────────────────────────

export interface WalletAdapter {
  id: WalletId;
  name: string;
  /** Display metadata for wallet-picker UIs. */
  meta: WalletMeta;
  isInstalled(): boolean;
  /**
   * Connects to the wallet and returns the user's public key.
   * Resolves to `null` if the user denies access or the wallet returns no
   * address, instead of throwing — callers **must** handle a `null` return.
   */
  connect(): Promise<string | null>;
  /**
   * Disconnects from the wallet. After this call the adapter's `getState()`
   * (if implemented) must return a `DisconnectedWalletState`.
   */
  disconnect(): void;
  signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string>;
  signMessage?(message: string, opts?: { accountToSign?: string }): Promise<string>;
  signAuthEntry?(entryPreimageXdr: string): Promise<string>;
  /**
   * Returns the current connection state as an explicit discriminated union.
   * Prefer this over storing `publicKey | null` in component state to avoid
   * the implicit-undefined bugs addressed by issue #832.
   *
   * If the adapter does not implement `getState()`, callers should fall back to
   * the `DisconnectedWalletState` sentinel.
   */
  getState?(): WalletConnectionState;
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

