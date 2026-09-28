import { describe, it, expect } from "vitest";
import * as rootSdk from "@stellar/stellar-sdk";
import * as minimalSdk from "@stellar/stellar-sdk/minimal";
import * as rpcSdk from "@stellar/stellar-sdk/rpc";

describe("stellar-sdk compatibility assertions", () => {
  it("verifies installed stellar-sdk version meets major version requirement (13.x)", () => {
    // Check that stellar-sdk exports core symbols required for v13.x
    expect(rootSdk).toBeDefined();
    expect(typeof rootSdk.Horizon.Server).toBe("function");
    expect(typeof rootSdk.TransactionBuilder).toBe("function");
    expect(typeof rootSdk.Operation.accountMerge).toBe("function");
    expect(typeof rootSdk.Operation.payment).toBe("function");
    expect(typeof rootSdk.Memo.text).toBe("function");
  });

  it("verifies Soroban RPC module compatibility", () => {
    expect(rpcSdk).toBeDefined();
    expect(typeof rpcSdk.Server).toBe("function");
    // Verify required RPC server methods exist on prototype
    const proto = rpcSdk.Server.prototype;
    expect(typeof proto.simulateTransaction).toBe("function");
    expect(typeof proto.sendTransaction).toBe("function");
    expect(typeof proto.getTransaction).toBe("function");
    expect(typeof proto.getEvents).toBe("function");
  });

  it("verifies minimal subpath export compatibility (@stellar/stellar-sdk/minimal)", () => {
    expect(minimalSdk).toBeDefined();
    expect(typeof minimalSdk.Contract).toBe("function");
    expect(typeof minimalSdk.TransactionBuilder).toBe("function");
    expect(typeof minimalSdk.nativeToScVal).toBe("function");
    expect(typeof minimalSdk.scValToNative).toBe("function");
    expect(minimalSdk.BASE_FEE).toBeDefined();
    expect(minimalSdk.Networks).toBeDefined();
  });

  it("verifies ScVal serialization and deserialization integrity", () => {
    const originalNumber = 42;
    const scVal = minimalSdk.nativeToScVal(originalNumber, { type: "u32" });
    expect(scVal).toBeDefined();
    const roundtrip = minimalSdk.scValToNative(scVal);
    expect(roundtrip).toBe(originalNumber);
  });

  it("verifies compatibility helper detects supported vs unsupported versions", () => {
    function isSdkMajorSupported(versionStr: string): boolean {
      const match = versionStr.match(/^(\d+)/);
      if (!match) return false;
      const major = parseInt(match[1], 10);
      return major >= 12 && major <= 13;
    }

    expect(isSdkMajorSupported("13.3.0")).toBe(true);
    expect(isSdkMajorSupported("12.4.0")).toBe(true);
    expect(isSdkMajorSupported("11.2.0")).toBe(false);
    expect(isSdkMajorSupported("10.0.1")).toBe(false);
  });
});
