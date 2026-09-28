/**
 * @file useBatchTrustline.test.ts
 * @description Unit tests for the useBatchTrustline hook.
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

const mockBuild = vi.fn().mockReturnValue({ toXDR: () => "batch-trustline-built-xdr" });
const mockAddOperation = vi.fn().mockReturnThis();
const mockSetTimeout = vi.fn().mockReturnThis();

vi.mock("@stellar/stellar-sdk", () => ({
  Asset: vi.fn().mockImplementation((code: string, issuer: string) => ({ type: "credit", code, issuer })),
  Horizon: {
    Server: vi.fn().mockImplementation(() => ({
      loadAccount: vi.fn().mockResolvedValue({ id: "GBATCHSOURCE", sequence: "100" }),
    })),
  },
  Operation: {
    changeTrust: vi.fn().mockImplementation((opts) => ({ type: "changeTrust", ...opts })),
  },
  TransactionBuilder: vi.fn().mockImplementation(() => ({
    addOperation: mockAddOperation,
    setTimeout: mockSetTimeout,
    build: mockBuild,
  })),
}));

const mockSubmitXdr = vi.fn().mockResolvedValue(undefined);
const mockReset = vi.fn();
const mockSignTransaction = vi.fn().mockResolvedValue("batch-signed-xdr");

vi.mock("../context", () => ({
  useStellarContext: () => ({
    config: {
      horizonUrl: "https://horizon-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
    },
  }),
}));

vi.mock("../hooks/useTransactionCore", () => ({
  useTransactionCore: () => ({
    submit: mockSubmitXdr,
    reset: mockReset,
    status: "idle",
    hash: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  }),
}));

vi.mock("../hooks/useFreighter", () => ({
  useFreighter: () => ({
    publicKey: "GBATCHFREIGHTERKEY1234567890123456789012345678901234567890",
    signTransaction: mockSignTransaction,
  }),
}));

vi.mock("../hooks/useWallet", () => ({
  useWallet: () => ({
    isConnected: false,
    publicKey: null,
    signTransaction: vi.fn(),
  }),
}));

vi.mock("../hooks/useStellarAccount", () => ({
  useStellarAccount: () => ({
    data: {
      balances: [
        {
          assetType: "credit_alphanum4",
          assetCode: "USDC",
          assetIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          balance: "100.0",
          balanceFloat: 100.0,
          buyingLiabilities: "0",
          sellingLiabilities: "0",
          isNative: false,
        },
      ],
    },
    refetch: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../utils", () => ({
  validatePublicKey: vi.fn(),
}));

import { useBatchTrustline } from "../hooks/useBatchTrustline";
import { Operation } from "@stellar/stellar-sdk";

describe("useBatchTrustline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with trustlines and methods", () => {
    const hook = useBatchTrustline();
    expect(hook.status).toBe("idle");
    expect(hook.isLoading).toBe(false);
    expect(hook.isSuccess).toBe(false);
    expect(hook.trustlines).toHaveLength(1);
    expect(hook.trustlines[0].assetCode).toBe("USDC");
    expect(typeof hook.submit).toBe("function");
    expect(typeof hook.setTrustlines).toBe("function");
  });

  it("throws error when submitting empty assets", async () => {
    const hook = useBatchTrustline({ assets: [] });
    await expect(hook.submit()).rejects.toThrow(
      "At least one asset is required for batch trustline setup."
    );
  });

  it("adds multiple changeTrust operations to a single transaction", async () => {
    const hook = useBatchTrustline();
    const assets = [
      { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
      { code: "EURT", issuer: "GBNZB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN", limit: "5000" },
    ];

    await hook.submit(assets);

    expect(Operation.changeTrust).toHaveBeenCalledTimes(2);
    expect(mockAddOperation).toHaveBeenCalledTimes(2);
    expect(mockSignTransaction).toHaveBeenCalled();
    expect(mockSubmitXdr).toHaveBeenCalledWith("batch-signed-xdr");
  });
});
