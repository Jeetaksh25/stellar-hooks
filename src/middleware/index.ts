/**
 * @file index.ts
 * @description Outgoing transaction middleware pipeline for stellar-hooks.
 *              Allows consumers to register middleware that runs before transaction submission
 *              (e.g., logging, validation, fee inspection/adjustment, analytics).
 * @package stellar-hooks
 * @license MIT
 */

import type { StellarXdrString } from "../types";

/**
 * Execution context passed to each middleware in the pipeline before transaction submission.
 */
export interface TransactionMiddlewareContext {
  /** The signed transaction XDR string to be submitted */
  signedXdr: StellarXdrString;
  /** Stellar network passphrase */
  networkPassphrase: string;
  /** Submission mode: "classic" (Horizon) or "soroban" (RPC) */
  mode?: "classic" | "soroban";
  /** Extensible key-value metadata container for passing data between middleware */
  meta: Record<string, unknown>;
  /** Optional transaction-level options passed by caller */
  options?: Record<string, unknown>;
}

/**
 * Next function called by middleware to pass control to the subsequent middleware in the pipeline.
 */
export type TransactionMiddlewareNext = () => Promise<void>;

/**
 * A transaction middleware function.
 * Receives the transaction context and a `next` callback to continue the pipeline.
 *
 * @example
 * ```ts
 * const loggingMiddleware: TransactionMiddleware = async (ctx, next) => {
 *   console.log("Submitting tx in mode:", ctx.mode);
 *   const start = Date.now();
 *   await next();
 *   console.log("Tx submission completed in", Date.now() - start, "ms");
 * };
 * ```
 */
export type TransactionMiddleware = (
  context: TransactionMiddlewareContext,
  next: TransactionMiddlewareNext
) => Promise<void> | void;

/**
 * Pipeline that manages and sequentially executes transaction middleware.
 */
export class TransactionPipeline {
  private middlewares: TransactionMiddleware[] = [];

  constructor(middlewares: TransactionMiddleware[] = []) {
    this.middlewares = [...middlewares];
  }

  /**
   * Adds one or more middleware to the end of the pipeline.
   */
  use(...middleware: TransactionMiddleware[]): this {
    this.middlewares.push(...middleware);
    return this;
  }

  /**
   * Returns a copy of the currently registered middlewares.
   */
  getMiddlewares(): TransactionMiddleware[] {
    return [...this.middlewares];
  }

  /**
   * Executes the middleware pipeline with the given context and final action (e.g. actual network submission).
   */
  async execute(
    context: TransactionMiddlewareContext,
    finalAction: () => Promise<void>
  ): Promise<void> {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multiple times in transaction middleware");
      }
      index = i;

      if (i < this.middlewares.length) {
        const fn = this.middlewares[i];
        await fn(context, () => dispatch(i + 1));
      } else {
        await finalAction();
      }
    };

    await dispatch(0);
  }
}

// ─── Global Middleware Registry ───────────────────────────────────────────────

const globalMiddlewares: TransactionMiddleware[] = [];

/**
 * Registers a global transaction middleware that will execute for all outgoing transactions.
 */
export function registerTransactionMiddleware(middleware: TransactionMiddleware): void {
  globalMiddlewares.push(middleware);
}

/**
 * Unregisters a previously registered global transaction middleware.
 */
export function unregisterTransactionMiddleware(middleware: TransactionMiddleware): void {
  const index = globalMiddlewares.indexOf(middleware);
  if (index >= 0) {
    globalMiddlewares.splice(index, 1);
  }
}

/**
 * Returns all currently registered global transaction middlewares.
 */
export function getRegisteredTransactionMiddleware(): TransactionMiddleware[] {
  return [...globalMiddlewares];
}

/**
 * Clears all globally registered transaction middlewares (primarily for testing).
 */
export function clearTransactionMiddlewareRegistry(): void {
  globalMiddlewares.length = 0;
}

// ─── Built-in Middleware Factories ───────────────────────────────────────────

export interface LoggingMiddlewareOptions {
  name?: string;
  logger?: (message: string, context?: unknown) => void;
}

/**
 * Creates a middleware that logs outgoing transaction details and execution timing.
 */
export function createLoggingMiddleware(options: LoggingMiddlewareOptions = {}): TransactionMiddleware {
  const { name = "TransactionPipeline", logger = console.log } = options;

  return async (context, next) => {
    const startTime = Date.now();
    logger(`[${name}] Submitting transaction (mode: ${context.mode ?? "classic"})`, {
      networkPassphrase: context.networkPassphrase,
      xdrLength: context.signedXdr?.length ?? 0,
    });

    try {
      await next();
      const elapsed = Date.now() - startTime;
      logger(`[${name}] Transaction submission succeeded in ${elapsed}ms`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      logger(`[${name}] Transaction submission failed after ${elapsed}ms:`, err);
      throw err;
    }
  };
}

/**
 * Creates a validation middleware that executes custom assertions on the transaction context before submission.
 */
export function createValidationMiddleware(
  validator: (context: TransactionMiddlewareContext) => void | Promise<void>
): TransactionMiddleware {
  return async (context, next) => {
    await validator(context);
    await next();
  };
}
