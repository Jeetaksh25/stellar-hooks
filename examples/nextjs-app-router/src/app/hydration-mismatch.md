# Avoiding Hydration Mismatches with stellar-hooks

When using stellar-hooks in a Next.js App Router app, you may encounter **hydration mismatches** - React errors where the server-rendered HTML doesn't match what the client renders on initial mount.

## What Causes Hydration Mismatches?

Hydration mismatches occur when:

1. **Server renders one thing, client renders another** - hooks return different values on server vs. first client render
2. **Dynamic data changes between render phases** - wallet detection, network state, etc.
3. **Browser-only APIs are called during SSR** - `window`, `localStorage`, etc.

### Example Mismatch Scenario

```tsx
// ❌ DANGEROUS - causes hydration mismatch
function BadWalletDisplay() {
  const [wallet, setWallet] = useState<string | null>(null);
  
  // This runs on server (null) then client (may be set)
  useEffect(() => {
    if (window.freighter) {
      setWallet("freighter");
    }
  }, []);

  return <p>Wallet: {wallet}</p>; // Server: "Wallet: null" → Client: "Wallet: freighter"
}
```

## The Problem withstellar-hooks Hooks

Many stellar-hooks have **conditional state**:

| Hook | Server Value | Client Value (initial) |
|------|-------------|----------------------|
| `useFreighter` | `isInstalled: false`, `isConnected: false` | May detect wallet extension |
| `useWallet` | `availableWallets: []` | May detect installed wallets |
| `useStellarBalance` | `balance: null` | May fetch balance from network |
| `useOperations` | `operations: []` | May fetch transaction history |

## Recommended Patterns

### Pattern 1: Client-Only Rendering with Suspense

The simplest and most reliable approach - let Next.js handle hydration boundaries.

```tsx
// ✅ GOOD - No hydration mismatch possible
import { useFreighter } from "stellar-hooks";

function WalletDisplay() {
  const { isInstalled, isConnected, publicKey } = useFreighter();
  
  return (
    <div>
      {isInstalled ? (
        isConnected ? (
          <p>Connected: {publicKey}</p>
        ) : (
          <button>Connect Wallet</button>
        )
      ) : (
        <p>Install wallet extension</p>
      )}
    </div>
  );
}

// In your page - no "use client" at page level needed
export default function Page() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <WalletDisplay />
    </Suspense>
  );
}
```

**Why this works:**
- The parent is a Server Component - renders loading fallback
- Client component only mounts after server render completes
- React handles hydration automatically

### Pattern 2: Explicit Client Boundary with Loading State

When you need client-only content but want server fallback:

```tsx
// ✅ GOOD - Explicit boundary with loading state
import { useFreighter } from "stellar-hooks";

function ClientWallet() {
  const { isInstalled, isConnected, publicKey } = useFreighter();
  
  // Show nothing on first client render until data is ready
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="animate-pulse">Checking wallet...</span>;
  }

  return (
    <div>
      {isInstalled ? (
        isConnected ? (
          <p>Connected: {publicKey}</p>
        ) : (
          <button>Connect Wallet</button>
        )
      ) : (
        <p>Install wallet extension</p>
      )}
    </div>
  );
}

export default function Page() {
  return <ClientWallet />;
}
```

### Pattern 3: Conditional SSR Based on Environment

For components that must be Server Components but use hooks:

```tsx
// ✅ GOOD - Conditional rendering based on environment
import { useFreighter } from "stellar-hooks";

function WalletContent() {
  const { isInstalled } = useFreighter();
  
  return (
    <div>
      {isInstalled ? (
        <p>Wallet detected! 🎉</p>
      ) : (
        <p>Install wallet to continue</p>
      )}
    </div>
  );
}

// Server Component wrapper
export default function Page() {
  if (typeof window === "undefined") {
    // Server: Return static fallback
    return (
      <div>
        <p>Wallet integration required</p>
        <a href="https://freighter.app">Install Freighter</a>
      </div>
    );
  }
  
  // Client: Render with hook
  return <WalletContent />;
}
```

### Pattern 4: Using Suspense Boundaries

Wrap potentially asynchronous hook data in Suspense:

```tsx
// ✅ GOOD - Suspense boundaries for async data
import { useStellarBalance } from "stellar-hooks";

function BalanceDisplay() {
  const { balance, isLoading } = useStellarBalance();
  
  if (isLoading) {
    return <span className="animate-pulse">Loading balance...</span>;
  }
  
  return <p>Balance: {balance?.toNumber().toFixed(7)}</p>;
}

// In page with Suspense
export default function Page() {
  return (
    <div>
      <Suspense fallback={<p>Fetching balance...</p>}>
        <BalanceDisplay />
      </Suspense>
    </div>
  );
}
```

## What NOT to Do

### ❌ Don't Store Hook State in Server Components

```tsx
// ❌ BAD - State created on server, hydration on client
export default function Page() {
  const { isConnected } = useFreighter(); // Hook in server component!
  
  return <p>Connected: {isConnected}</p>;
}
```

### ❌ Don't Return Different Types Between Server and Client

```tsx
// ❌ BAD - Type mismatch causes hydration error
function BadComponent() {
  const { isInstalled } = useFreighter();
  
  // Server: string, Client: element
  return isInstalled ? "Wallet found!" : <p>Install wallet</p>;
}
```

### ❌ Don't Use Browser APIs in Server Components

```tsx
// ❌ BAD - window doesn't exist on server
export default function Page() {
  const [wallet, setWallet] = useState<string | null>(null);
  
  useEffect(() => {
    // This runs on server too (in dev) but throws
    if (window.freighter) {
      setWallet("freighter");
    }
  }, []);
  
  return <p>{wallet}</p>;
}
```

## Practical Examples from This App

### ✅ Wallet Connection (Correct)

```tsx
// src/components/wallet-connect.tsx
"use client";

export function WalletConnect() {
  const { isInstalled, isConnected, publicKey, connect } = useFreighter();
  
  if (!isInstalled) {
    return <p>Install wallet extension</p>;
  }
  
  if (!isConnected) {
    return <button onClick={connect}>Connect</button>;
  }
  
  return <p>Connected: {publicKey}</p>;
}
```

**Why it works:**
1. `"use client"` directive ensures only client execution
2. No conditional state that differs between server/client
3. Render always consistent based on hook state

### ✅ Account Balance (Correct with Loading State)

```tsx
// src/components/account-balance.tsx
"use client";

export function AccountBalance() {
  const { balance, isLoading, error } = useStellarBalance();
  
  if (isLoading && !balance) {
    return <span className="animate-pulse">Loading...</span>;
  }
  
  if (error) {
    return <p>Error: {error.message}</p>;
  }
  
  return <p>Balance: {balance?.toNumber().toFixed(7)}</p>;
}
```

**Why it works:**
1. Explicit loading state prevents mismatch
2. Error state handled gracefully
3. Client-only execution

## Summary

| Approach | When to Use | Example |
|----------|-------------|---------|
| **Client Components** | Any hook usage | `"use client"` + hooks |
| **Suspense Boundaries** | Async data fetching | `<Suspense fallback>` |
| **Loading States** | Hook data that may be null | Show loader until ready |
| **Environment Guards** | Components that must be server-rendered | `typeof window === "undefined"` |

The golden rule: **If a hook returns different values on server vs. client, render a loading state or use a client component boundary.**

## Further Reading

- [Next.js Documentation: Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Next.js Documentation: Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Documentation: Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
