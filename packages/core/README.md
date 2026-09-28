# @stellar-hooks/core

Framework-agnostic utilities for building Stellar and Soroban applications. Zero React dependency.

## What's in this package

| Module | Contents |
|--------|----------|
| `@stellar-hooks/core` (root) | Re-exports everything below |
| `@stellar-hooks/core/network` | `NETWORK_CONFIGS`, `resolveNetworkConfig`, network types |
| `@stellar-hooks/core/rpc` | `parseAccountResponse`, `parseBalance`, `sleep`, `backoff` |
| `@stellar-hooks/core/xdr` | `decodeXdr`, `formatXdrResult`, `detectXdrType` |
| `@stellar-hooks/core/errors` | `StellarHookError`, `UserRejectedError`, `ErrorCode`, … |

## Installation

```bash
npm install @stellar-hooks/core
```

`@stellar/stellar-sdk` is a peer dependency — install it alongside:

```bash
npm install @stellar/stellar-sdk
```

## Usage

```ts
import { NETWORK_CONFIGS, parseAccountResponse, ErrorCode } from "@stellar-hooks/core";

// Use a network preset
const { horizonUrl } = NETWORK_CONFIGS.mainnet;

// Parse a raw Horizon account response (Node.js, Vue, Svelte, etc.)
const accountData = parseAccountResponse(rawHorizonResponse);

// Handle errors by code
try {
  await someOperation();
} catch (err) {
  if (err instanceof StellarHookError && err.code === ErrorCode.UserRejected) {
    // user clicked "Decline" in the wallet popup
  }
}
```

## Relationship to `stellar-hooks`

`stellar-hooks` (the React package) re-exports everything from
`@stellar-hooks/core` so **existing consumers don't need to change anything**.
This package exists so non-React consumers (Node.js scripts, Vue/Svelte apps,
server-side code) can import just what they need without pulling in React.

## Versioning

All packages in the `stellar-hooks` monorepo share the same version number,
managed by [Changesets](https://github.com/changesets/changesets).

## License

MIT
