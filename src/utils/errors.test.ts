import { describe, it, expect } from "vitest";
import {
  ErrorCode,
  StellarHookError,
  UserRejectedError,
  FreighterNotInstalledError,
  WalletNotConnectedError,
  WalletNotInstalledError,
  TransactionFailedError,
  TransactionTimeoutError,
  NetworkError,
  SimulationError,
  RateLimitedError,
  isUserRejectionMessage,
} from "./errors";
import { ValidationError } from "./validation";

describe("ErrorCode enum and structured errors", () => {
  it("defines stable ErrorCode values", () => {
    expect(ErrorCode.WALLET_NOT_CONNECTED).toBe("WALLET_NOT_CONNECTED");
    expect(ErrorCode.WALLET_NOT_INSTALLED).toBe("WALLET_NOT_INSTALLED");
    expect(ErrorCode.FREIGHTER_NOT_INSTALLED).toBe("FREIGHTER_NOT_INSTALLED");
    expect(ErrorCode.USER_REJECTED).toBe("USER_REJECTED");
    expect(ErrorCode.SIMULATION_ERROR).toBe("SIMULATION_ERROR");
    expect(ErrorCode.TRANSACTION_FAILED).toBe("TRANSACTION_FAILED");
    expect(ErrorCode.TRANSACTION_TIMEOUT).toBe("TRANSACTION_TIMEOUT");
    expect(ErrorCode.NETWORK_ERROR).toBe("NETWORK_ERROR");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.UNKNOWN_ERROR).toBe("UNKNOWN_ERROR");
  });

  it("creates UserRejectedError with code USER_REJECTED", () => {
    const error = new UserRejectedError("User cancelled", { walletId: "freighter" });
    expect(error.code).toBe(ErrorCode.USER_REJECTED);
    expect(error.walletId).toBe("freighter");
    expect(error instanceof StellarHookError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it("creates FreighterNotInstalledError with code FREIGHTER_NOT_INSTALLED", () => {
    const error = new FreighterNotInstalledError();
    expect(error.code).toBe(ErrorCode.FREIGHTER_NOT_INSTALLED);
    expect(error instanceof StellarHookError).toBe(true);
  });

  it("creates WalletNotConnectedError with code WALLET_NOT_CONNECTED", () => {
    const error = new WalletNotConnectedError();
    expect(error.code).toBe(ErrorCode.WALLET_NOT_CONNECTED);
    expect(error.message).toContain("not connected");
  });

  it("creates WalletNotInstalledError with code WALLET_NOT_INSTALLED", () => {
    const error = new WalletNotInstalledError("xBull is not installed", { walletId: "xbull" });
    expect(error.code).toBe(ErrorCode.WALLET_NOT_INSTALLED);
    expect(error.walletId).toBe("xbull");
  });

  it("creates TransactionFailedError and TransactionTimeoutError", () => {
    const failErr = new TransactionFailedError("Tx submission failed", {
      txHash: "abc",
      resultCode: "op_underfunded",
    });
    expect(failErr.code).toBe(ErrorCode.TRANSACTION_FAILED);
    expect(failErr.txHash).toBe("abc");
    expect(failErr.resultCode).toBe("op_underfunded");

    const timeoutErr = new TransactionTimeoutError("Polling timed out", { txHash: "abc" });
    expect(timeoutErr.code).toBe(ErrorCode.TRANSACTION_TIMEOUT);
    expect(timeoutErr.txHash).toBe("abc");
  });

  it("creates NetworkError with code NETWORK_ERROR", () => {
    const netErr = new NetworkError("Connection refused");
    expect(netErr.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it("creates SimulationError with code SIMULATION_ERROR", () => {
    const simErr = new SimulationError("Simulation failed", { errorCode: "host_error" });
    expect(simErr.code).toBe(ErrorCode.SIMULATION_ERROR);
    expect(simErr.errorCode).toBe("host_error");
  });

  it("ValidationError extends StellarHookError with VALIDATION_ERROR code", () => {
    const valErr = new ValidationError("Invalid public key");
    expect(valErr.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(valErr instanceof StellarHookError).toBe(true);
    expect(valErr instanceof ValidationError).toBe(true);
  });

  it("StellarHookError.from infers codes from messages", () => {
    const err1 = StellarHookError.from(new Error("User rejected the signature"));
    expect(err1.code).toBe(ErrorCode.USER_REJECTED);

    const err2 = StellarHookError.from(new Error("Freighter is not installed"));
    expect(err2.code).toBe(ErrorCode.WALLET_NOT_INSTALLED);

    const err3 = StellarHookError.from(new Error("Wallet is not connected. Call connect() first."));
    expect(err3.code).toBe(ErrorCode.WALLET_NOT_CONNECTED);

    const err4 = StellarHookError.from(new Error("NetworkError: fetch failed"));
    expect(err4.code).toBe(ErrorCode.NETWORK_ERROR);

    const err5 = StellarHookError.from(new Error("Transaction timed out"));
    expect(err5.code).toBe(ErrorCode.TRANSACTION_TIMEOUT);

    const err6 = StellarHookError.from(new Error("Something completely random"));
    expect(err6.code).toBe(ErrorCode.UNKNOWN_ERROR);
  });

  it("isUserRejectionMessage identifies rejection phrases", () => {
    expect(isUserRejectionMessage("User denied transaction")).toBe(true);
    expect(isUserRejectionMessage("popup closed by user")).toBe(true);
    expect(isUserRejectionMessage("Network timeout")).toBe(false);
  });
});

describe("RateLimitedError", () => {
  it("creates a RateLimitedError with correct code", () => {
    const err = new RateLimitedError();
    expect(err.code).toBe(ErrorCode.RATE_LIMITED);
    expect(err.name).toBe("RateLimitedError");
    expect(err instanceof StellarHookError).toBe(true);
    expect(err.message).toContain("429");
  });

  it("stores retryAfter and endpoint", () => {
    const err = new RateLimitedError("Custom message", {
      retryAfter: 30,
      endpoint: "https://horizon-testnet.stellar.org/accounts/GABC",
    });
    expect(err.retryAfter).toBe(30);
    expect(err.endpoint).toBe("https://horizon-testnet.stellar.org/accounts/GABC");
    expect(err.context?.retryAfter).toBe(30);
    expect(err.context?.endpoint).toBe("https://horizon-testnet.stellar.org/accounts/GABC");
  });

  it("works without optional fields", () => {
    const err = new RateLimitedError("Rate limited");
    expect(err.retryAfter).toBeUndefined();
    expect(err.endpoint).toBeUndefined();
  });

  it("StellarHookError.from detects 429 from message and returns RateLimitedError", () => {
    const err = StellarHookError.from(new Error("429 Too Many Requests"));
    expect(err.code).toBe(ErrorCode.RATE_LIMITED);
    expect(err).toBeInstanceOf(RateLimitedError);
  });

  it("StellarHookError.from detects rate limit from message", () => {
    const err = StellarHookError.from(new Error("Rate limit exceeded"));
    expect(err.code).toBe(ErrorCode.RATE_LIMITED);
    expect(err).toBeInstanceOf(RateLimitedError);
  });

  it("StellarHookError.from extracts retryAfter from response headers", () => {
    const cause = new Error("429 Too Many Requests");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cause as any).response = {
      headers: new Headers({ "retry-after": "60" }),
      url: "https://horizon.stellar.org/accounts/GABC",
    };
    const err = StellarHookError.from(cause);
    expect(err).toBeInstanceOf(RateLimitedError);
    const rlErr = err as RateLimitedError;
    expect(rlErr.retryAfter).toBe(60);
    expect(rlErr.endpoint).toBe("https://horizon.stellar.org/accounts/GABC");
  });

  it("StellarHookError.from extracts retryAfter from plain object headers", () => {
    const cause = new Error("429 Too Many Requests");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cause as any).response = {
      headers: { "Retry-After": "15" },
      url: "https://horizon-testnet.stellar.org",
    };
    const err = StellarHookError.from(cause);
    expect(err).toBeInstanceOf(RateLimitedError);
    expect((err as RateLimitedError).retryAfter).toBe(15);
  });

  it("StellarHookError.from extracts retryAfter from error property", () => {
    const cause = new Error("Rate limited");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cause as any).retryAfter = 42;
    const err = StellarHookError.from(cause);
    expect(err).toBeInstanceOf(RateLimitedError);
    expect((err as RateLimitedError).retryAfter).toBe(42);
  });

  it("RATE_LIMITED is in the ErrorCode enum", () => {
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
  });
});
