/**
 * @file provider.test.ts
 * @description Live Testnet smoke coverage for provider config + useFeeStats
 * fetcher normalization without jsdom XHR hangs.
 *
 * Opt-in — see `npm run test:testnet`.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  TESTNET,
  assertTestnetReachable,
} from "./helpers";
import { normalizeFeeStats } from "../../../src/hooks/useFeeStats";
import { NETWORK_CONFIGS } from "../../../src/types";

describe("Testnet live provider/config surface", () => {
  beforeAll(async () => {
    await assertTestnetReachable();
  }, 30_000);

  it("NETWORK_CONFIGS.testnet matches the published Testnet endpoints", () => {
    expect(NETWORK_CONFIGS.testnet).toEqual(TESTNET);
    expect(NETWORK_CONFIGS.testnet.horizonUrl).toContain("testnet");
    expect(NETWORK_CONFIGS.testnet.sorobanRpcUrl).toContain("testnet");
  });

  it("useFeeStats normalizeFeeStats accepts a live Horizon fee_stats payload", async () => {
    const response = await fetch(
      `${TESTNET.horizonUrl.replace(/\/$/, "")}/fee_stats`,
    );
    expect(response.ok).toBe(true);

    const data = await response.json();
    const normalized = normalizeFeeStats(data);
    expect(normalized).toMatchObject({
      minFee: expect.any(Number),
      modeFee: expect.any(Number),
      p10Fee: expect.any(Number),
      p20Fee: expect.any(Number),
      p30Fee: expect.any(Number),
      p40Fee: expect.any(Number),
      p50Fee: expect.any(Number),
      p60Fee: expect.any(Number),
      p70Fee: expect.any(Number),
      p80Fee: expect.any(Number),
      p90Fee: expect.any(Number),
      p95Fee: expect.any(Number),
      p99Fee: expect.any(Number),
    });
  });
});
