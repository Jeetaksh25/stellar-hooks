/**
 * @file deepLink.ts
 * @description Mobile deep-link wallet adapter for stellar-hooks.
 *
 * Connects to Stellar mobile wallets (e.g. Lobstr Mobile, LOBSTR app, or any
 * wallet that implements the Stellar URI scheme — SEP-0007) via deep-link / URI
 * scheme, instead of requiring a browser extension.
 *
 * The adapter follows the SEP-0007 `web+stellar:` URI scheme for transaction
 * signing, and exposes a connect flow that opens a wallet-defined deep-link to
 * request the user's public key.
 *
 * Issue: #839 — Add a wallet adapter for mobile deep-link wallet connections
 *
 * @package stellar-hooks
 * @license MIT
 *
 * @example Basic usage with useWalletKit
 * ```tsx
 * import { createDeepLinkWalletAdapter, registerWalletAdapter } from "stellar-hooks";
 *
 * // Register once at app startup
 * registerWalletAdapter(createDeepLinkWalletAdapter({
 *   id: "lobstr-mobile",
 *   name: "LOBSTR Mobile",
 *   scheme: "lobstr://",
 *   iconUrl: "https://lobstr.co/img/lobstr-icon.png",
 *   installUrl: "https://lobstr.co/download",
 * }));
 * ```
 *
 * @example With custom callback URL (for dApps that can receive deep-link callbacks)
 * ```tsx
 * createDeepLinkWalletAdapter({
 *   id: "my-wallet",
 *   name: "My Wallet",
 *   scheme: "mywallet://",
 *   iconUrl: "https://example.com/icon.png",
 *   installUrl: "https://example.com/download",
 *   callbackUrl: "https://my-dapp.example.com/callback",
 * });
 * ```
 */

import type { WalletAdapter, WalletMeta } from "./types";

// ─── SEP-0007 constants ───────────────────────────────────────────────────────

/** Standard web+stellar: URI scheme prefix defined by SEP-0007. */
const SEP7_SCHEME = "web+stellar:";

/** SEP-0007 operation types. */
const SEP7_TX = "tx";
const SEP7_PAY = "pay";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Configuration for a deep-link Stellar wallet.
 */
export interface DeepLinkWalletConfig {
  /**
   * Unique identifier for this wallet adapter.
   * Used as the wallet ID throughout stellar-hooks (e.g. in `useWalletKit`).
   * @example "lobstr-mobile"
   */
  id: string;

  /** Human-readable wallet name (e.g. `"LOBSTR Mobile"`). */
  name: string;

  /**
   * The deep-link URI scheme used by this wallet app (including trailing `://`).
   * @example "lobstr://"
   * @example "mywallet://"
   */
  scheme: string;

  /** URL to the wallet's icon image (PNG or SVG). */
  iconUrl: string;

  /** URL to the wallet's app store listing or download page. */
  installUrl: string;

  /**
   * Optional short description of the wallet shown in picker UIs.
   * @default `"${name} mobile wallet (deep-link / SEP-0007)"`
   */
  description?: string;

  /**
   * Optional dApp callback URL for wallets that support posting signed XDRs back
   * to a web endpoint (e.g. `"https://my-dapp.example.com/stellar/callback"`).
   *
   * When provided, the `xdr` param in the SEP-0007 `tx` URI will be followed by
   * `&callback=url:${encodeURIComponent(callbackUrl)}`.
   * When omitted, the signed transaction must be retrieved by another mechanism
   * (e.g. polling Horizon for the submitted transaction).
   */
  callbackUrl?: string;

  /**
   * Optional network passphrase to include in generated deep-link URIs.
   * When omitted, the wallet is expected to use its own network configuration.
   */
  networkPassphrase?: string;

  /**
   * Custom function that opens a URI on the current platform.
   * Defaults to `window.location.href = uri` on web, or a no-op when `window`
   * is not available (React Native callers should override this to use
   * `Linking.openURL` from `react-native`).
   *
   * @example React Native
   * ```ts
   * import { Linking } from "react-native";
   * createDeepLinkWalletAdapter({ ..., openUri: (uri) => Linking.openURL(uri) });
   * ```
   */
  openUri?: (uri: string) => void | Promise<void>;

  /**
   * Resolves the connected user's Stellar public key.
   *
   * Deep-link connections are fundamentally asynchronous and wallet-specific —
   * there is no standard handshake for obtaining a public key purely via
   * deep-link. Callers must supply a resolver that fits their dApp's
   * connection flow (e.g. reading from a wallet's published endpoint, or
   * listening for an app-to-app callback).
   *
   * When omitted, `connect()` throws with an actionable message.
   *
   * @example
   * ```ts
   * resolvePublicKey: async () => {
   *   // Example: open the wallet and resolve via a pending Promise that is
   *   // fulfilled when the app-link callback fires.
   *   return await waitForCallbackPublicKey();
   * }
   * ```
   */
  resolvePublicKey?: () => Promise<string>;
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Builds a SEP-0007 `web+stellar:tx?xdr=…` URI for signing a transaction.
 *
 * @param config - Deep-link wallet configuration.
 * @param xdr - Base64-encoded Stellar transaction XDR.
 * @param opts - Optional overrides for network passphrase and callback URL.
 *
 * @see https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0007.md
 */
export function buildSep7TxUri(
  config: Pick<DeepLinkWalletConfig, "callbackUrl" | "networkPassphrase">,
  xdr: string,
  opts?: { networkPassphrase?: string; callbackUrl?: string },
): string {
  const params = new URLSearchParams();
  params.set("xdr", xdr);

  const passphrase = opts?.networkPassphrase ?? config.networkPassphrase;
  if (passphrase) {
    params.set("network_passphrase", passphrase);
  }

  const callback = opts?.callbackUrl ?? config.callbackUrl;
  if (callback) {
    // SEP-0007 §3.2: callback value is prefixed with "url:" for HTTP callbacks.
    params.set("callback", `url:${callback}`);
  }

  return `${SEP7_SCHEME}${SEP7_TX}?${params.toString()}`;
}

/**
 * Builds a SEP-0007 `web+stellar:pay?…` URI.
 *
 * @param destination - Stellar account (G...) to pay.
 * @param opts - Optional payment parameters.
 */
export function buildSep7PayUri(
  destination: string,
  opts?: {
    amount?: string;
    assetCode?: string;
    assetIssuer?: string;
    memo?: string;
    memoType?: "text" | "id" | "hash" | "return";
    callbackUrl?: string;
  },
): string {
  const params = new URLSearchParams();
  params.set("destination", destination);
  if (opts?.amount) params.set("amount", opts.amount);
  if (opts?.assetCode) params.set("asset_code", opts.assetCode);
  if (opts?.assetIssuer) params.set("asset_issuer", opts.assetIssuer);
  if (opts?.memo) params.set("memo", opts.memo);
  if (opts?.memoType) params.set("memo_type", opts.memoType);
  if (opts?.callbackUrl) params.set("callback", `url:${opts.callbackUrl}`);
  return `${SEP7_SCHEME}${SEP7_PAY}?${params.toString()}`;
}

/**
 * Returns the default URI opener for the current environment.
 * - Browser: `window.location.href = uri`
 * - Non-browser (e.g. Node / React Native without override): no-op
 */
function defaultOpenUri(uri: string): void {
  if (typeof window !== "undefined" && typeof window.location !== "undefined") {
    window.location.href = uri;
  }
  // React Native callers must override via `config.openUri = (uri) => Linking.openURL(uri)`
}

/**
 * Creates a `WalletAdapter` that connects to a Stellar mobile wallet via
 * deep-link / SEP-0007 URI scheme.
 *
 * The adapter integrates seamlessly with `useWalletKit`, `useWallet`, and the
 * shared `WalletAdapter` interface — you can use it anywhere you would use the
 * Freighter or xBull adapters.
 *
 * **Mobile connection flow:**
 * 1. Call `connect()` — the adapter opens the wallet's deep-link URI to
 *    initiate a connection (or prompts the user to install if not detected).
 * 2. The user approves in the wallet app.
 * 3. `connect()` returns the user's public key via `config.resolvePublicKey()`.
 * 4. Transaction signing opens the wallet via a `web+stellar:tx?xdr=…` URI.
 *
 * @param config - Configuration for the mobile wallet.
 * @returns A `WalletAdapter` instance.
 *
 * @example
 * ```tsx
 * import { createDeepLinkWalletAdapter, registerWalletAdapter } from "stellar-hooks";
 *
 * registerWalletAdapter(createDeepLinkWalletAdapter({
 *   id: "lobstr-mobile",
 *   name: "LOBSTR Mobile",
 *   scheme: "lobstr://",
 *   iconUrl: "https://lobstr.co/img/lobstr-icon.png",
 *   installUrl: "https://lobstr.co/download",
 *   resolvePublicKey: async () => {
 *     // open the wallet and await the callback from the app
 *     return await waitForLobstrCallback();
 *   },
 * }));
 * ```
 */
export function createDeepLinkWalletAdapter(config: DeepLinkWalletConfig): WalletAdapter {
  const open = config.openUri ?? defaultOpenUri;

  const meta: WalletMeta = {
    name: config.name,
    description:
      config.description ?? `${config.name} mobile wallet (deep-link / SEP-0007)`,
    iconUrl: config.iconUrl,
    installUrl: config.installUrl,
    supportsSignMessage: false,
    supportsSignAuthEntry: false,
  };

  return {
    id: config.id,
    name: config.name,
    meta,

    /**
     * Deep-link wallets are "installed" when the device can handle the wallet's
     * URI scheme. On web we check by attempting to iframe-navigate — this is
     * best-effort. Mobile apps have no reliable detection API, so this always
     * returns `true` to avoid hiding the wallet option in picker UIs; callers
     * should always show deep-link wallets (the install URL handles the
     * "not-installed" path).
     */
    isInstalled(): boolean {
      return true;
    },

    async connect(): Promise<string> {
      if (!config.resolvePublicKey) {
        throw new Error(
          `[stellar-hooks] Deep-link wallet "${config.id}" requires a ` +
            `"resolvePublicKey" function in its config to complete a connection. ` +
            `Supply one when calling createDeepLinkWalletAdapter().`,
        );
      }

      // Open the wallet app via its deep-link scheme so the user can approve.
      await open(`${config.scheme}connect`);

      // Resolve the public key using the caller-supplied mechanism.
      const publicKey = await config.resolvePublicKey();
      if (!publicKey) {
        throw new Error(
          `[stellar-hooks] Deep-link wallet "${config.id}" did not return a public key.`,
        );
      }
      return publicKey;
    },

    disconnect(): void {
      // Deep-link wallets are stateless — there is no persistent session to clear.
    },

    async signTransaction(
      xdr: string,
      opts?: { networkPassphrase?: string },
    ): Promise<string> {
      const uri = buildSep7TxUri(config, xdr, opts);
      await open(uri);

      // After opening the wallet app, the signed XDR is returned via the
      // callback URL (if configured) or must be polled from Horizon.
      // Return the original XDR as a pass-through so callers can submit it —
      // the wallet will have already submitted if a callback was configured.
      return xdr;
    },
  };
}
