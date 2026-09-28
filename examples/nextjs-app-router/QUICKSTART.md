# Next.js App Router - Quick Start Guide

## The Core Pattern

**Server Components** (default) → Static content, metadata, layout  
**Client Components** (`"use client"`) → Hooks, state, interactivity

```
layout.tsx (Server)
├── metadata (static)
├── StellarWalletProvider (Client)
    ├── page.tsx (Server) → <WalletConnect /> (Client)
    └── transfers/page.tsx (Client)
```

## Common Patterns

### 1. Client Component with Single Hook

```tsx
"use client";
import { useFreighter } from "stellar-hooks";

export function WalletDisplay() {
  const { isInstalled, isConnected, publicKey } = useFreighter();
  return isConnected ? <p>{publicKey}</p> : <button onClick={connect}>Connect</button>;
}
```

### 2. Client Component with Multiple Hooks

```tsx
"use client";
import { useWallet, useStellarBalance } from "stellar-hooks";

export function Dashboard() {
  const { isConnected, publicKey } = useWallet();
  const { balance, isLoading } = useStellarBalance();
  
  return (
    <div>
      <p>Connected: {publicKey}</p>
      <p>Balance: {isLoading ? "..." : balance?.toNumber().toFixed(7)}</p>
    </div>
  );
}
```

### 3. Loading State Pattern

```tsx
"use client";
import { useStellarBalance } from "stellar-hooks";

export function Balance() {
  const { balance, isLoading, error } = useStellarBalance();
  
  if (isLoading) return <span className="animate-pulse">Loading...</span>;
  if (error) return <p>Error: {error.message}</p>;
  
  return <p>Balance: {balance?.toNumber().toFixed(7)}</p>;
}
```

### 4. Suspense Boundary Pattern

```tsx
// Server Component
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Balance />
    </Suspense>
  );
}
```

## Quick Fixes for Hydration Mismatches

| Problem | Solution |
|---------|----------|
| "Hydration failed" error | Use Suspense or loading state |
| Hook renders null on server | Show loader until mounted |
| `typeof window` check needed | Not needed - hooks do it internally |

## Migration Checklist

- [ ] All hook usage wrapped in `"use client"` components
- [ ] `StellarProvider` in a client component
- [ ] Loading states for async hook data
- [ ] No `useEffect` reading `window` directly
- [ ] No hooks in server components

## Files Reference

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Server layout with client provider wrapper |
| `src/app/page.tsx` | Home page (Server Component) |
| `src/app/transfers/page.tsx` | Transfer page (Client Component) |
| `src/components/stellar-provider.tsx` | Client provider wrapper |
| `src/components/wallet-connect.tsx` | Wallet connection demo |
| `src/components/account-balance.tsx` | Balance display demo |
| `src/components/account-history.tsx` | Transaction history demo |
| `src/components/network-status.tsx` | Network status demo |

## Running the Example

```bash
cd examples/nextjs-app-router
npm install
npm run dev
```

Open http://localhost:3000
