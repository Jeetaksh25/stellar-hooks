/**
 * Shared helpers for live Testnet integration tests.
 */
import React from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { StellarProvider } from "../../../src/context";
import { NETWORK_CONFIGS } from "../../../src/types";
import { clearMemoizedServers } from "../../../src/utils/memoizedServers";

export const TESTNET = NETWORK_CONFIGS.testnet;
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export function withTestnetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return React.createElement(
    StellarProvider,
    { network: "testnet" },
    children,
  );
}

/** Reset memoized Horizon/RPC clients between tests. */
export function resetServers(): void {
  clearMemoizedServers();
}

/**
 * Create a fresh keypair and fund it via Testnet Friendbot.
 * Returns the funded public key.
 */
export async function fundFreshAccount(): Promise<string> {
  const keypair = Keypair.random();
  const publicKey = keypair.publicKey();
  const url = `${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Friendbot funding failed (${response.status}): ${body.slice(0, 200)}`,
    );
  }
  return publicKey;
}

/** Soft connectivity probe — skips the suite when Testnet is unreachable. */
export async function assertTestnetReachable(): Promise<void> {
  const timeoutMs = 15_000;
  const response = await Promise.race([
    fetch(TESTNET.horizonUrl),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Testnet Horizon timed out after ${timeoutMs}ms`)),
        timeoutMs,
      );
    }),
  ]);
  if (!response.ok) {
    throw new Error(`Horizon responded with ${response.status}`);
  }
}
