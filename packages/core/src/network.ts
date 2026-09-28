/**
 * @file network.ts
 * @description Stellar network configuration constants and types.
 *
 * This module is intentionally framework-agnostic: no React, no browser APIs.
 * It can be imported from Node.js scripts, Vue/Svelte bindings, or any other
 * environment that needs Stellar network presets.
 *
 * @package @stellar-hooks/core
 * @license MIT
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Identifies the Stellar network to connect to.
 */
export type StellarNetwork = "mainnet" | "testnet" | "futurenet" | "custom";

/**
 * Network configuration for a non-custom (preset) network.
 */
export interface PresetNetworkConfig {
  /** The preset network identifier. */
  network: Exclude<StellarNetwork, "custom">;
  /** Horizon REST API endpoint URL for this network. */
  horizonUrl: string;
  /** Soroban RPC endpoint URL for contract simulation and submission. */
  sorobanRpcUrl: string;
  /** Stellar network passphrase used when signing transactions. */
  networkPassphrase: string;
}

/**
 * Configuration for a private or self-hosted Stellar network.
 *
 * @example
 * ```ts
 * const config: CustomNetworkConfig = {
 *   network: "custom",
 *   horizonUrl: "https://my-horizon.example.com",
 *   sorobanRpcUrl: "https://my-rpc.example.com",
 *   networkPassphrase: "My Network ; 2024",
 * };
 * ```
 */
export interface CustomNetworkConfig {
  network: "custom";
  /** Horizon REST API base URL for this network. */
  horizonUrl: string;
  /** Soroban RPC endpoint for contract simulation and submission. */
  sorobanRpcUrl: string;
  /** Network passphrase used when signing transactions. */
  networkPassphrase: string;
}

/**
 * Union of preset or custom network configuration.
 */
export type NetworkConfig = PresetNetworkConfig | CustomNetworkConfig;

// ─── Built-in presets ─────────────────────────────────────────────────────────

/**
 * Built-in network presets for the three public Stellar networks.
 *
 * @example
 * ```ts
 * import { NETWORK_CONFIGS } from "@stellar-hooks/core/network";
 *
 * const { horizonUrl } = NETWORK_CONFIGS.mainnet;
 * ```
 */
export const NETWORK_CONFIGS = {
  testnet: {
    network: "testnet" as const,
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  mainnet: {
    network: "mainnet" as const,
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://mainnet.sorobanrpc.com",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
  },
  futurenet: {
    network: "futurenet" as const,
    horizonUrl: "https://horizon-futurenet.stellar.org",
    sorobanRpcUrl: "https://rpc-futurenet.stellar.org",
    networkPassphrase: "Test SDF Future Network ; October 2022",
  },
} satisfies Record<Exclude<StellarNetwork, "custom">, PresetNetworkConfig>;

/**
 * Resolves a `StellarNetwork` identifier to a `NetworkConfig`.
 * For `"custom"` you must provide the `customConfig` argument.
 *
 * @throws {Error} If `network === "custom"` and no `customConfig` is provided.
 */
export function resolveNetworkConfig(
  network: StellarNetwork,
  customConfig?: CustomNetworkConfig,
): NetworkConfig {
  if (network === "custom") {
    if (!customConfig) {
      throw new Error(
        '[stellar-hooks/core] network is "custom" but no customConfig was provided.',
      );
    }
    return customConfig;
  }
  return NETWORK_CONFIGS[network];
}
