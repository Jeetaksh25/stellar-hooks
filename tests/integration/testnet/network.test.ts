/**
 * @file network.test.ts
 * @description Live Testnet connectivity checks via the Stellar SDK + fetch.
 *
 * Opt-in only — run with `npm run test:testnet`.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Horizon, Keypair, rpc } from "@stellar/stellar-sdk";
import {
  TESTNET,
  FRIENDBOT_URL,
  assertTestnetReachable,
  resetServers,
  fundFreshAccount,
} from "./helpers";
import { NETWORK_CONFIGS } from "../../../src/types";

describe("Testnet live network (SDK)", () => {
  beforeAll(async () => {
    await assertTestnetReachable();
  }, 30_000);

  afterAll(() => {
    resetServers();
  });

  it("exposes the expected Testnet NETWORK_CONFIGS endpoints", () => {
    expect(TESTNET.network).toBe("testnet");
    expect(TESTNET.horizonUrl).toBe("https://horizon-testnet.stellar.org");
    expect(TESTNET.sorobanRpcUrl).toBe("https://soroban-testnet.stellar.org");
    expect(TESTNET.networkPassphrase).toBe(
      "Test SDF Network ; September 2015",
    );
  });

  it("Horizon.root() returns a healthy ledger on Testnet", async () => {
    const server = new Horizon.Server(TESTNET.horizonUrl);
    const root = await server.root();

    expect(root.history_latest_ledger).toBeGreaterThan(0);
    expect(root.network_passphrase).toBe(TESTNET.networkPassphrase);
  });

  it("Soroban RPC getHealth() reports healthy on Testnet", async () => {
    const server = new rpc.Server(TESTNET.sorobanRpcUrl);
    const health = await server.getHealth();
    expect(health.status).toBe("healthy");
  });

  it("can fund a fresh account via Friendbot", async () => {
    const publicKey = await fundFreshAccount();
    expect(publicKey).toMatch(/^G/);

    // Verify the account was created
    const server = new Horizon.Server(TESTNET.horizonUrl);
    const account = await server.accounts.account({ publicKey });
    expect(account.id).toBe(publicKey);
  }, 30_000);
});
