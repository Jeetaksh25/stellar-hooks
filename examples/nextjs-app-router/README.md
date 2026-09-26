# Next.js App Router Example

A comprehensive example showing how to use **stellar-hooks** with the Next.js **App Router**, demonstrating proper client/server boundaries and SSR-safe hook usage.

## Why this example exists

The App Router lets you mark files as **Server Components** (the default) or **Client Components** (with a leading `"use client"` directive). stellar-hooks hooks are built on browser-only APIs — `window`, wallet extensions (Freighter), and live network calls — so **they can only run inside Client Components**.

This example draws that boundary precisely:

```
src/app/
├── layout.tsx                      # Server Component (metadata, html/body)
├── page.tsx                        # Server Component (static page shell)
├── transfers/                      # Client Component page for payments
└── components/
    ├── stellar-provider.tsx        # "use client" → mounts <StellarProvider>
    ├── wallet-connect.tsx          # "use client" → calls useFreighter
    ├── account-balance.tsx         # "use client" → calls useStellarBalance
    ├── account-history.tsx         # "use client" → calls useOperations
    └── network-status.tsx          # "use client" → calls useNetwork, useNetworkStatus
```

The pattern in four rules:

1. **Keep `layout.tsx` and static pages as Server Components** unless they genuinely need interactivity. Static shell and `metadata` stay on the server.
2. **Mount `StellarProvider` from a client component.** The provider owns wallet/network state, so it must live on the client. The server `layout` wraps `<StellarWalletProvider>` (a client component) around the page tree.
3. **Call hooks only from client components.** Every component that invokes a stellar-hooks hook needs a `"use client"` directive.
4. **Pass data down, never pass components up.** Server components render static props; client components receive `children` or serializable props.

### Runtime behavior

- `page.tsx` renders on the server, then hands off to the client components.
- Client components run hooks on the client only, listening for wallet extensions and network state.
- Hooks include `typeof window` guards for SSR safety.

## Pages

### `/` - Home

Static page demonstrating the client/server boundary with multiple client components:

- **WalletConnect**: Connect your Freighter wallet
- **AccountBalance**: View your XLM balance
- **AccountHistory**: Display recent transactions
- **NetworkStatus**: Monitor network health

### `/transfers` - Send Payments

Full-featured payment page demonstrating:

- Multi-wallet support with `useWallet`
- Path payment creation with `usePathPayment`
- Dynamic wallet detection and connection
- Transaction form with validation

## Getting started

```bash
cd examples/nextjs-app-router
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Wallet Setup

Install the [Freighter](https://freighter.app) browser extension to test wallet connections:

1. Click **Connect Freighter** on the home page
2. Grant access in the wallet extension
3. See your public key and balance displayed

## Other scripts

```bash
npm run build      # Production build (server + client bundles)
npm start          # Serve the production build
npm run lint       # Lint the example
```

## Components Reference

### `stellar-provider.tsx`

A client component that wraps your app with `StellarProvider`:

```tsx
"use client";

import { StellarProvider } from "stellar-hooks";

export function StellarWalletProvider({ children }) {
  return <StellarProvider network="testnet">{children}</StellarProvider>;
}
```

**Key points:**
- Must have `"use client"` directive
- Wraps all pages that use stellar-hooks
- Provides network configuration to child components
- Uses SSR-safe hooks that check `typeof window` before accessing browser APIs

### `wallet-connect.tsx`

Connect to Freighter wallet using `useFreighter`:

```tsx
"use client";

import { useFreighter } from "stellar-hooks";

export function WalletConnect() {
  const { isConnected, publicKey, connect, disconnect } = useFreighter();
  // ...
}
```

### `account-balance.tsx`

Display account balance with auto-refresh using `useStellarBalance`:

```tsx
"use client";

import { useStellarBalance } from "stellar-hooks";

export function AccountBalance() {
  const { balance, isLoading, error, refresh } = useStellarBalance();
  // ...
}
```

### `account-history.tsx`

Show transaction history using `useOperations`:

```tsx
"use client";

import { useOperations } from "stellar-hooks";

export function AccountHistory() {
  const { operations, isLoading, hasMore, loadMore } = useOperations({
    accountPubKey: publicKey,
  });
  // ...
}
```

### `network-status.tsx`

Monitor network status using `useNetwork` and `useNetworkStatus`:

```tsx
"use client";

import { useNetwork, useNetworkStatus } from "stellar-hooks";

export function NetworkStatus() {
  const { network, config } = useNetwork();
  const { status, isLoading, refresh } = useNetworkStatus();
  // ...
}
```

### `transfers/page.tsx`

Complete payment flow using `useWallet` and `usePathPayment`:

```tsx
"use client";

import { useWallet, usePathPayment } from "stellar-hooks";

export default function TransfersPage() {
  const { isConnected, publicKey, connect } = useWallet();
  const { pathPayment, isLoading, error } = usePathPayment();
  // ...
}
```

## SSR Safety Patterns

All stellar-hooks include built-in SSR guards:

```tsx
// Hooks check for browser environment
if (typeof window === "undefined") return;

// localStorage access is wrapped
if (typeof window === "undefined" || !window.localStorage) return;

// IntersectionObserver checks available
if (typeof IntersectionObserver === "undefined") return;
```

You don't need to add these guards manually - they're built into the hooks.

See [`src/app/hydration-mismatch.md`](./src/app/hydration-mismatch.md) for comprehensive guidance on avoiding hydration issues with hooks that return different values on server vs. client.

## Client/Server Boundary Cheat Sheet

| What | Component Type | Example |
|------|---------------|---------|
| Layout metadata, HTML structure | Server | `layout.tsx` |
| Static page content | Server | `page.tsx` |
| Wallet state management | Client | `StellarWalletProvider` |
| Hook usage (all stellar-hooks) | Client | `useFreighter`, `useStellarBalance` |
| Dynamic data fetching | Client | `useOperations`, `useStellarOffers` |
| Form handlers with hooks | Client | Payment forms, transaction builders |

## Troubleshooting

### "window is not defined" error

This means a hook is being rendered on the server. Ensure:
1. The component has `"use client"` at the top
2. The component (or an ancestor) is wrapped in `StellarProvider`
3. No hooks are called in server components

### Hydration Mismatch Errors

**Error:** `Hydration failed because the server rendered HTML didn't match the client`

**Cause:** Hooks return different values on server vs. first client render (e.g., wallet detection, network state).

**Solutions:**

1. **Use Suspense Boundaries** for async hook data:
   ```tsx
   <Suspense fallback={<p>Loading...</p>}>
     <WalletDisplay />
   </Suspense>
   ```

2. **Add explicit loading states**:
   ```tsx
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return <span>Loading...</span>;
   ```

3. **Keep hook usage in Client Components only**:
   ```tsx
   "use client";
   export default function Page() {
     const { isConnected } = useFreighter();
     // ...
   }
   ```

See `src/app/hydration-mismatch.md` for comprehensive guidance on avoiding hydration issues.

### Wallet not detected

- Make sure Freighter extension is installed
- Check browser console for errors
- Verify you're running in a browser environment (not SSR preview)

### Balance shows as loading forever

- Check network connectivity
- Verify the account exists on the network
- Look for error messages in the UI or console
