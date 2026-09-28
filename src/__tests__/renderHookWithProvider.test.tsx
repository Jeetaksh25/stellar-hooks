/**
 * @file renderHookWithProvider.test.tsx
 * @description Unit tests for the renderHookWithProvider test helper (#848).
 * @package stellar-hooks
 * @license MIT
 */

import React, { createContext, useContext } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useStellarContext } from "../context";
import { NETWORK_CONFIGS, type CustomNetworkConfig } from "../types";
import { renderHookWithProvider } from "../mocks/renderHookWithProvider";

const TEST_CUSTOM_CONFIG: CustomNetworkConfig = {
  network: "custom",
  horizonUrl: "https://custom-horizon.example.com",
  sorobanRpcUrl: "https://custom-rpc.example.com",
  networkPassphrase: "Custom Stellar Network ; 2026",
};

describe("renderHookWithProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("automatically supplies StellarProvider with default testnet configuration", () => {
    const { result } = renderHookWithProvider(() => useStellarContext());

    expect(result.current.network).toBe("testnet");
    expect(result.current.config).toEqual(NETWORK_CONFIGS.testnet);
  });

  it("forwards custom providerProps (mainnet, futurenet, and customConfig)", () => {
    const { result: mainnetResult } = renderHookWithProvider(
      () => useStellarContext(),
      { providerProps: { network: "mainnet" } }
    );
    expect(mainnetResult.current.network).toBe("mainnet");
    expect(mainnetResult.current.config).toEqual(NETWORK_CONFIGS.mainnet);

    const { result: customResult } = renderHookWithProvider(
      () => useStellarContext(),
      {
        providerProps: {
          network: "custom",
          customConfig: TEST_CUSTOM_CONFIG,
        },
      }
    );
    expect(customResult.current.network).toBe("custom");
    expect(customResult.current.config).toEqual(TEST_CUSTOM_CONFIG);
  });

  it("supports network switching and initialProps forwarding", () => {
    const { result, rerender } = renderHookWithProvider(
      ({ prefix }: { prefix: string }) => {
        const ctx = useStellarContext();
        return `${prefix}:${ctx.network}`;
      },
      { initialProps: { prefix: "net" } }
    );

    expect(result.current).toBe("net:testnet");
    rerender({ prefix: "active" });
    expect(result.current).toBe("active:testnet");
  });

  it("composes an optional inner wrapper inside StellarProvider", () => {
    const ExtraContext = createContext("default-extra");
    const InnerWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <ExtraContext.Provider value="composed-extra">{children}</ExtraContext.Provider>
    );

    const { result } = renderHookWithProvider(
      () => ({
        stellar: useStellarContext(),
        extra: useContext(ExtraContext),
      }),
      {
        providerProps: { network: "futurenet" },
        wrapper: InnerWrapper,
      }
    );

    expect(result.current.stellar.network).toBe("futurenet");
    expect(result.current.extra).toBe("composed-extra");
  });
});
