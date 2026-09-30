# `useOracleHistory` Resolution — Issue #913

**Issue:** "Add `useOracleHistory` for historical price series" — *"Hook to page
through historical price records from a Soroban oracle contract for charting use
cases."* Labels: `enhancement`, `hook`, `oracle`.

## Summary

`useOracleHistory` **already exists** in this repository. It was added in commit
`ce76515` (*"feat(hooks): add useOracleHistory hook for historical price series"*)
and is exported from `src/hooks/index.ts:2`:

```ts
export * from './useOracleHistory';
```

However, the implementation is a non-functional stub. It cannot be imported, it
cannot typecheck, and every code path in it fails at runtime. This document
records the verified defects and specifies the implementation required to make
the hook real.

**This PR does not include the code fix.** The specification below is written to
be applied directly.

---

## Verification performed

All findings were verified against a clean install of the repository at
`main` (`045e141` region, `@stellar/stellar-sdk@13.3.0`):

| Claim | How verified | Result |
| --- | --- | --- |
| `soroban-client` is not a dependency | `grep -c "soroban-client" package.json` | `0` |
| Import does not resolve | `tsc` on an isolated probe with the repo's compiler options | **`error TS2307: Cannot find module 'soroban-client'`** |
| `callContractFunction` does not exist | Enumerated `rpc.Server` prototype methods | absent |
| `callContract` does not exist either | `typeof server.callContract` | `undefined` |
| `SorobanRpc` is not an SDK export | `typeof sdk.SorobanRpc` | `undefined` |
| `getLedgerEntries` cannot page history | Signature inspection | takes `...keys: xdr.LedgerKey[]` only |
| `getEvents` *can* page history | `RpcServer.GetEventsRequest` | `{ filters, startLedger?, endLedger?, cursor?, limit? }` |
| Hook is absent from docs | `grep -c useOracleHistory README.md` | `0` |

### One thing to know before running `tsc`

`npx tsc --noEmit -p tsconfig.json` on `main` reports **38 errors in 3 files** —
`src/hooks/useSorobanServer.ts`, `src/hooks/useTransactionLifecycle.ts`, and
`src/utils/errorStrings.ts` — and every one is a **syntactic** error
(TS1005, TS1109, TS1110, TS1128, TS1136, TS1160), introduced by commit `3829379`
(*"feat: add RateLimitedError for graceful HTTP 429 handling (#844)"*).

TypeScript reports only syntactic diagnostics when a program fails to parse, so
these 38 errors **mask every semantic error in the repository** — which is
precisely why the `TS2307` above was never caught. There is no open issue
tracking this. It is out of scope for #913, but it needs its own issue: until it
is fixed, no type error in this codebase will be detected by CI.

To reproduce the `TS2307` while those files are broken, check the file in
isolation:

```bash
# probe.ts
import { SorobanRpc, Server, xdr } from 'soroban-client';
```

---

## Defects

`src/hooks/useOracleHistory.ts` is 87 lines.

### 1. The import cannot resolve (blocking, line 2)

```ts
import { SorobanRpc, Server, xdr } from 'soroban-client';
```

The package `soroban-client` is **not a dependency** of this repository and is
not in the dependency tree. The repository depends on
`@stellar/stellar-sdk@13.3.0` and `@stellar/freighter-api@6.0.1`. Every other
hook imports from `@stellar/stellar-sdk`.

This is not a rename. `soroban-client` was the pre-13.x SDK; its `Server` and
`SorobanRpc` surface does not exist under those names in 13.3.0
(`sdk.SorobanRpc` is `undefined`, and `SorobanRpc` is only reachable as
`sdk.rpc`). `SorobanRpc`, `xdr` and `Contract` are all imported and never used.

**Fix** — mirror the convention every other hook follows:

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { rpc, xdr, Contract } from '@stellar/stellar-sdk';
import { useStellarContext } from '../context';
import { getRpcServer } from '../utils/memoizedServers';
```

### 2. The RPC call is fabricated (blocking, line 49)

```ts
const response = await server.callContractFunction('price_history', ...args);
```

`callContractFunction` is not a method on any Stellar client. Neither is
`callContract`. The comment above it — *"Assuming the contract exposes a method
`price_history` that returns an array of (ledger, price, timestamp) tuples"* —
gives away that the method was never verified.

This throws a `TypeError` on the first call, unconditionally.

### 3. The chosen primitive cannot read history anyway

This is the substantive design problem, and it is the reason the fix is not a
mechanical rename.

In `@stellar/stellar-sdk@13.3.0`, `getLedgerEntries` is:

```ts
getLedgerEntries(...keys: xdr.LedgerKey[]): Promise<Api.GetLedgerEntriesResponse>;
```

It accepts **keys only** — no ledger range — and returns only the *current*
value of each key. Soroban RPC has no way to query what a contract's storage
held in a past ledger. The existing `useLedgerEntries` hook
(`src/hooks/useLedgerEntries.ts:17-24`) has the same limitation: its options are
`enabled`, `refetchInterval` and `cacheTTL`, with no ledger bounds.

**A price series therefore cannot be assembled from historical contract state.**
The only primitive that reads history is `getEvents`, whose request type is
exactly the shape the issue is asking for:

```ts
interface GetEventsRequest {
  filters: Api.EventFilter[];
  startLedger?: number;
  endLedger?: number;
  cursor?: string;
  limit?: number;
}
```

`startLedger`, `endLedger`, `cursor` and `limit` map one-to-one onto the
stub's existing `startLedger`, `endLedger`, `pageSize` and `cursor` options.
**The option surface was designed correctly; only the call was wrong.**

**This makes the implementation contingent on a contract design decision the
issue does not state.** Reading history via events requires the oracle contract
to emit an event per price update with the price and timestamp in the payload. If
it does not, the alternatives are:

1. **Accumulate forward from the current value** — poll, append, never backfill.
   Simple, but produces no history on first run, which defeats "historical".
2. **Read an off-chain indexer** rather than the chain. Correct, but adds an
   external dependency the library does not currently have.

Recommendation: implement against `getEvents`, and make the event symbol
configurable so the hook is not hardcoded to one oracle's layout. Confirm the
target oracle's event shape before merge — this is the one open question that
cannot be resolved from inside this repository.

### 4. `useCallback` invoked as an effect — setState during render (lines 74-78)

```ts
// Initial load
useCallback(() => {
  if (records.length === 0 && cursor !== null) {
    fetchPage();
  }
}, [records, cursor, fetchPage])();
```

The callback is **called immediately** and its return value discarded. The
intent was an effect. As written, `fetchPage()` — and therefore `setLoading`,
`setError` and `setRecords` — executes **during render**. This triggers React's
"Cannot update a component while rendering a different component" warning and
risks an unbounded render loop, because `fetchPage` is recreated whenever
`loading` changes, which is itself set during render.

**Fix:**

```ts
useEffect(() => {
  void fetchPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [contractId, startLedger, endLedger, pageSize]);
```

### 5. The memoization guard is unreliable (line 37, 71)

```ts
const fetchPage = useCallback(async () => {
  if (loading) return;
  ...
}, [contractId, cursor, pageSize, endLedger, rpcUrl, loading]);
```

`loading` is captured in the closure, so the guard tests the value from the
render that created the callback, not the live value. Combined with the
render-phase call above, the guard does not prevent the double-fetch it is
written to prevent. Use a ref, as `useTransactionHistory` does with
`fetchIdRef` (`src/hooks/useTransactionHistory.ts:83`).

### 6. `server` is missing from the dependency array (line 71)

`server` is used at line 49 but is neither created inside the callback nor
listed in the deps. This is an exhaustive-deps violation, and it is how the
`new Server(rpcUrl)` on line 34 became load-bearing: the callback closes over a
client that is a *different instance on every render*.

### 7. Network configuration is ignored (line 28, 34)

```ts
rpcUrl = 'https://rpc.stellar.org',
...
const server = new Server(rpcUrl);
```

Every other hook resolves its endpoint from context. `useTransactionHistory`
(`:70-71`):

```ts
const { config } = useStellarContext();
const server = getHorizonServer(config.horizonUrl);
```

Two problems. The default is wrong — the library's mainnet preset is
`https://mainnet.sorobanrpc.com` (`src/types/index.ts:212`), not
`https://rpc.stellar.org` — and it is hardcoded, so the hook cannot be used
against testnet or futurenet without every consumer passing a URL by hand.

The repository already ships the memoized accessor
(`src/utils/memoizedServers.ts`), which caches per URL and exports
`clearMemoizedServers()` for tests:

```ts
const rpcCache = new Map<string, rpc.Server>();
export function getRpcServer(url: string): rpc.Server { /* … */ }
```

**Fix:**

```ts
const { config } = useStellarContext();
const server = useMemo(() => getRpcServer(config.sorobanRpcUrl), [config.sorobanRpcUrl]);
```

### 8. Public types are not exported (lines 5, 11)

```ts
interface OracleHistoryRecord { … }
interface UseOracleHistoryOptions { … }
```

Neither is exported, so a consumer cannot type the records, the options, or a
wrapper around the hook. Every comparable hook in this library exports its
options and state types (`UseLedgerEntriesOptions`, `LedgerEntriesState` at
`src/hooks/useLedgerEntries.ts:17, 26`).

### 9. Return shape diverges from the library convention

The stub returns `loading`. The sibling paging hook returns `isLoading`:

```ts
// useTransactionHistory.ts:204-215
return {
  transactions, fetchNextPage, fetchPreviousPage, loadMore,
  hasNext, hasPrevious, isLoading, error, cursor: nextCursor ?? null, reset,
};
```

Adopting `isLoading` keeps the package coherent. Given the divergence is
already public (`index.ts:2` exports it), fixing it in the same change is far
cheaper than in a later major.

### 10. Unvalidated response shape (lines 51-56)

```ts
const fetched: OracleHistoryRecord[] = (response as any).map(
  ([ledger, price, timestamp]: [number, string, number]) => ({ ledger, price, timestamp })
);
```

`as any` on the response, an unchecked positional destructuring on each element,
and the inline comment *"The response format depends on the contract; adapt as
needed"* (`:50`). If the response is not an array, `.map` throws a
`TypeError` that lands in the `catch` and surfaces as a generic failure. If it
is an array of the wrong shape, the records are silently `undefined` and the
chart renders blank — the exact failure this issue's charting use case is meant
to prevent.

Validate the decoded shape and throw a named error on mismatch.

### 11. Pagination termination and duplication (lines 58-65)

```ts
setRecords(prev => [...prev, ...fetched]);
if (fetched.length < pageSize) {
  setCursor(null);
} else {
  const lastLedger = fetched[fetched.length - 1].ledger;
  setCursor(lastLedger + 1);
}
```

Three separate problems:

- **Off-by-one page.** A series whose length is an exact multiple of `pageSize`
  triggers one extra request that returns nothing. Not fatal, but it is a wasted
  round trip on every clean boundary.
- **Silent truncation.** With `getEvents` the correct end-of-data signal is an
  absent cursor, not a short page. A short page caused by a transient condition
  truncates the series with no error and no indication to the caller.
- **Unbounded duplication.** `fetched` is appended without deduplication. Any
  cursor overlap — which happens routinely when `startLedger` is a moving
  window — inserts duplicate points, and duplicate timestamps break chart
  rendering.

Deduplicate by ledger number on append, and use the response cursor.

### 12. `startLedger` changes are ignored (line 33)

```ts
const [cursor, setCursor] = useState<number | null>(startLedger ?? null);
```

A `useState` initialiser applies only on first mount, so a caller who changes
`startLedger` after mount gets the old window with no indication. The sibling
hook handles this with an explicit `reset` and a `resetKey` counter
(`useTransactionHistory.ts:86`).

### 13. No test and no documentation

- No `useOracleHistory.test.ts`. `src/hooks/__tests__/` contains one test file.
- No `docs/hooks/use-oracle-history.md`, while `docs/hooks/` holds a page per
  hook including `use-transaction-history.md`.
- Zero mentions in `README.md`. The hook table at `README.md:171` lists
  `useTransactionHistory()`; `useOracleHistory` is absent.
- No entry in `CHANGELOG.md`.

The hook is exported and publicly reachable today, entirely undocumented. That
is why this stub has gone unnoticed.

---

## Target API

```ts
export interface OracleHistoryPoint {
  /** Ledger sequence in which the price was recorded. */
  ledger: number;
  /** Price as a decimal string, preserving the contract's precision. */
  price: string;
  /** Unix timestamp, or `null` if the event did not carry one. */
  timestamp: number | null;
}

export interface UseOracleHistoryOptions {
  /** Contract id of the oracle emitting the events. */
  contractId: string;
  /** Inclusive first ledger. Defaults to `pageSize` ledgers back from latest. */
  startLedger?: number;
  /** Inclusive last ledger. Defaults to the latest ledger. */
  endLedger?: number;
  /** Events per request. Default 100, matching the Soroban RPC default. */
  pageSize?: number;
  /** Event symbol to filter on. Defaults to `'price_update'`. */
  eventSymbol?: string;
  /** Set false to suppress automatic fetching. Default true. */
  enabled?: boolean;
}

export interface UseOracleHistoryReturn {
  /** Accumulated series, ascending by ledger. */
  points: OracleHistoryPoint[];
  isLoading: boolean;
  error: Error | null;
  /** True while another page may exist. */
  hasMore: boolean;
  /** Fetch the next page and append. */
  fetchNextPage: () => Promise<void>;
  /** Cursor for the next page, or null. */
  cursor: string | null;
  /** Clear state and restart from `startLedger`. */
  reset: () => void;
}
```

Notes on specific choices:

- **`price` stays a `string`.** A Soroban price is an `i128` scaled by a
  precision factor. Parsing to `number` loses precision above
  `Number.MAX_SAFE_INTEGER` and would silently corrupt chart values. Format
  for display at the call site.
- **`timestamp` is `number | null`.** Events do not necessarily carry one.
  Fabricating a timestamp from the ledger closure time is acceptable for
  charting but must be distinguishable from a real one.
- **`eventSymbol` is configurable.** The library should not hardcode one
  oracle's event layout, and the target oracle is not specified in #913.

---

## Fetch implementation

```ts
const fetchPage = useCallback(async () => {
  if (cursorRef.current === null) return;
  const request: rpc.Server.GetEventsRequest = {
    filters: [
      { type: 'contract', contractIds: [contractId], topics: [[eventSymbol]] },
    ],
    startLedger,
    endLedger,
    limit: pageSize,
    ...(cursorRef.current ? { cursor: cursorRef.current } : {}),
  };

  const response = await server.getEvents(request);
  // Decode and validate each event into OracleHistoryPoint; throw a named
  // error if an entry does not match the expected shape.
  const nextPoints = decodePriceEvents(response.events ?? []);

  setPoints(prev => dedupeByLedger([...prev, ...nextPoints]));

  // End-of-data is an absent cursor, not a short page.
  cursorRef.current = response.cursor ?? null;
  setCursor(response.cursor ?? null);
}, [contractId, eventSymbol, startLedger, endLedger, pageSize, server]);
```

`rpc.Server.GetEventsRequest` is the correct request type for this SDK version.
A `try/catch` should set `error` and leave the existing `points` intact rather
than clearing them, so a failed page does not destroy data already collected.

---

## Tests

Conventions follow `src/hooks/__tests__/useFreighter.test.ts`: vitest with
`renderHook` and `act` from `@testing-library/react`, and `vi.mock` on the SDK
module. Call `clearMemoizedServers()` between tests so a cached client does not
leak across cases.

```ts
vi.mock('@stellar/stellar-sdk', async () => {
  const actual = await vi.importActual('@stellar/stellar-sdk');
  return { ...actual, rpc: { ...actual.rpc, Server: vi.fn() } };
});
```

Required cases:

- **Sends the right request.** Assert `getEvents` is called with
  `startLedger`, `endLedger`, `limit: pageSize` and a `contract` filter naming
  the contract id and event symbol.
- **Uses the context endpoint.** With testnet context, assert the client was
  created with `config.sorobanRpcUrl` — this is the regression guard for
  defect 7.
- **Decodes points in ledger order** from a realistic event payload.
- **Follows the cursor** on the second call and stops when `response.cursor` is
  absent, asserting `getEvents` is called exactly twice.
- **Does not duplicate on overlapping pages.** Two pages sharing a boundary
  ledger yield one copy of that point.
- **Handles an empty series** — `events: []` yields `points: []`,
  `hasMore: false`, no error.
- **Surfaces a malformed payload as a named error** rather than `undefined`
  points (defect 10).
- **Keeps existing points when a page fails** — a rejection on the second page
  leaves page one intact and sets `error`.
- **Resets** when `startLedger` changes, and `reset()` restarts from the
  beginning.
- **No fetch when `enabled: false`**, and the first fetch runs in an effect
  rather than during render — the regression guard for defect 4. `renderHook`
  plus React's render-phase-update warning makes this catchable.
- **Does not double-fetch on mount**, pinning the defect-5 guard.

---

## Documentation

1. **`README.md`** — add a row to the hook table next to
   `useTransactionHistory()` (`README.md:171`) and a usage section in the
   `###` body.
2. **`docs/hooks/use-oracle-history.md`** — follow the structure of
   `docs/hooks/use-transaction-history.md`: description, signature, options
   table, return table, example.
3. **`CHANGELOG.md`** — entry under the unreleased/next section.
4. **JSDoc on the hook** — the current comment says *"pages through the
   contract's `price_history` method"*, which is the incorrect assumption from
   defect 2 and must be corrected to describe event-based retrieval.

---

## Sequencing

1. Fix the import (defect 1) and the RPC call (defect 2) so the hook runs at
   all. These are inseparable — neither is testable alone.
2. Replace the render-phase callback with `useEffect` (defect 4) and the stale
   `loading` guard with a ref (defect 5). Until this lands, any test involving
   mount behaviour is unreliable.
3. Move to context-driven, memoized server (defects 6, 7).
4. Export the types and align the return shape (defects 8, 9).
5. Validate the decoded shape and fix pagination (defects 10, 11, 12).
6. Add the tests, then the docs.

Steps 1-2 are the minimum to make the hook work at all. Step 3 is what makes it
usable in this library rather than merely functional. **The open question from
defect 3 — whether the target oracle emits per-update events — should be
confirmed before step 1**, because the answer determines whether this hook is
implementable as specified at all.
