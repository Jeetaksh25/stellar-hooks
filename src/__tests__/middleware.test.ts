/**
 * @file middleware.test.ts
 * @description Unit tests for transaction middleware pipeline.
 * @package stellar-hooks
 * @license MIT
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TransactionPipeline,
  createLoggingMiddleware,
  createValidationMiddleware,
  registerTransactionMiddleware,
  unregisterTransactionMiddleware,
  getRegisteredTransactionMiddleware,
  clearTransactionMiddlewareRegistry,
  type TransactionMiddlewareContext,
} from "../middleware";

describe("TransactionPipeline", () => {
  beforeEach(() => {
    clearTransactionMiddlewareRegistry();
  });

  it("executes middleware in order and invokes finalAction", async () => {
    const order: number[] = [];
    const pipeline = new TransactionPipeline([
      async (_ctx, next) => {
        order.push(1);
        await next();
        order.push(4);
      },
      async (_ctx, next) => {
        order.push(2);
        await next();
        order.push(3);
      },
    ]);

    const ctx: TransactionMiddlewareContext = {
      signedXdr: "test-xdr" as any,
      networkPassphrase: "test-passphrase",
      mode: "classic",
      meta: {},
    };

    let executedFinal = false;
    await pipeline.execute(ctx, async () => {
      order.push(99);
      executedFinal = true;
    });

    expect(executedFinal).toBe(true);
    expect(order).toEqual([1, 2, 99, 3, 4]);
  });

  it("allows middleware to modify context metadata", async () => {
    const pipeline = new TransactionPipeline([
      async (ctx, next) => {
        ctx.meta.customFlag = true;
        await next();
      },
    ]);

    const ctx: TransactionMiddlewareContext = {
      signedXdr: "xdr" as any,
      networkPassphrase: "test",
      mode: "soroban",
      meta: {},
    };

    await pipeline.execute(ctx, async () => {});
    expect(ctx.meta.customFlag).toBe(true);
  });

  it("halts execution when a middleware throws", async () => {
    const pipeline = new TransactionPipeline([
      createValidationMiddleware((ctx) => {
        if (ctx.signedXdr === "bad-xdr") {
          throw new Error("Validation rejected transaction");
        }
      }),
    ]);

    const badCtx: TransactionMiddlewareContext = {
      signedXdr: "bad-xdr" as any,
      networkPassphrase: "test",
      mode: "classic",
      meta: {},
    };

    const finalFn = vi.fn();
    await expect(pipeline.execute(badCtx, finalFn)).rejects.toThrow(
      "Validation rejected transaction"
    );
    expect(finalFn).not.toHaveBeenCalled();
  });

  it("logs with createLoggingMiddleware", async () => {
    const mockLogger = vi.fn();
    const loggingMiddleware = createLoggingMiddleware({ logger: mockLogger });
    const pipeline = new TransactionPipeline([loggingMiddleware]);

    const ctx: TransactionMiddlewareContext = {
      signedXdr: "log-xdr" as any,
      networkPassphrase: "test",
      mode: "classic",
      meta: {},
    };

    await pipeline.execute(ctx, async () => {});
    expect(mockLogger).toHaveBeenCalledTimes(2);
  });

  it("supports global registration and deregistration", () => {
    const mw = vi.fn();
    expect(getRegisteredTransactionMiddleware()).toHaveLength(0);

    registerTransactionMiddleware(mw);
    expect(getRegisteredTransactionMiddleware()).toHaveLength(1);
    expect(getRegisteredTransactionMiddleware()[0]).toBe(mw);

    unregisterTransactionMiddleware(mw);
    expect(getRegisteredTransactionMiddleware()).toHaveLength(0);
  });
});
