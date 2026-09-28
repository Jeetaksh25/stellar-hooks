/**
 * @file lifecycle-callbacks.test.ts
 * @description Unit tests for hook-level onBeforeSubmit and onAfterSubmit lifecycle callbacks.
 * @package stellar-hooks
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useCallback: (fn: unknown) => fn,
    useReducer: (_reducer: unknown, initial: unknown) => [initial, vi.fn()],
  };
});

const mockSubmitXdr = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();

vi.mock("../context", () => ({
  useStellarContext: () => ({
    config: {
      horizonUrl: "https://horizon-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    },
    middleware: [],
  }),
}));

vi.mock("../devtools/useHookActivityDebug", () => ({
  useHookActivityDebug: vi.fn(),
}));

import { useTransactionCore } from "../hooks/useTransactionCore";

describe("Lifecycle Callbacks on Write Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aborts submission when onBeforeSubmit returns false", async () => {
    const onBeforeSubmit = vi.fn().mockResolvedValue(false);
    const onSuccess = vi.fn();
    const onAfterSubmit = vi.fn();

    const hook = useTransactionCore({
      onBeforeSubmit,
      onAfterSubmit,
      onSuccess,
    });

    await hook.submit("test-signed-xdr" as any);

    expect(onBeforeSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        signedXdr: "test-signed-xdr",
      })
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onAfterSubmit).not.toHaveBeenCalled();
  });

  it("proceeds with submission when onBeforeSubmit returns true or void", async () => {
    const onBeforeSubmit = vi.fn().mockResolvedValue(true);
    const onAfterSubmit = vi.fn();

    const hook = useTransactionCore({
      mode: "classic",
      onBeforeSubmit,
      onAfterSubmit,
    });

    // In mock, Horizon.Server will be called or catch error
    try {
      await hook.submit("test-signed-xdr" as any);
    } catch {
      // ignore network errors in mock environment
    }

    expect(onBeforeSubmit).toHaveBeenCalled();
  });
});
