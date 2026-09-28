import { WalletConnect } from "@/components/wallet-connect";
import { AccountBalance } from "@/components/account-balance";
import { AccountHistory } from "@/components/account-history";
import { NetworkStatus } from "@/components/network-status";

/**
 * Main page - Server Component
 * 
 * This page is a Server Component and demonstrates the correct client/server
 * boundary in Next.js App Router:
 * 
 * - Static content and layout are server-rendered
 * - Any hook usage (stellar-hooks) lives in "use client" child components
 * - Data fetching with hooks happens client-side only
 * 
 * The app structure:
 * - layout.tsx: Server Component that wraps client provider
 * - page.tsx: Server Component that renders static content
 * - child components: Client Components that use hooks
 */
export default function Home() {
  return (
    <main className="space-y-8">
      <section className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">stellar-hooks · Next.js App Router</h1>
        <p className="text-lg text-gray-600">
          Minimal example demonstrating proper client/server boundaries when using
          stellar-hooks in the Next.js App Router.
        </p>
        <p className="text-gray-600">
          This page and the layout are Server Components. Hooks are reached only
          through the client components below, which have the <code>"use client"</code>
          directive.
        </p>
      </section>

      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Wallet</h2>
        <p className="text-gray-600">
          Connect to your Stellar wallet (Freighter recommended). Wallet hooks
          require client-side execution since they access browser extensions.
        </p>
        <WalletConnect />
      </section>

      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Account Balance</h2>
        <p className="text-gray-600">
          View your XLM balance. The balance auto-refreshes and displays
          formatted amounts.
        </p>
        <AccountBalance />
      </section>

      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Account History</h2>
        <p className="text-gray-600">
          Display recent transactions for your account. Shows payment,
          account creation, and other operations.
        </p>
        <AccountHistory />
      </section>

      <section className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Network Status</h2>
        <p className="text-gray-600">
          Monitor the current network status including horizon status and
          ledger information.
        </p>
        <NetworkStatus />
      </section>

      <section className="max-w-3xl mx-auto space-y-4 border-t pt-8">
        <h2 className="text-2xl font-semibold">Key Patterns</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">"use client"</span>
            <p className="text-gray-600">
              Always include this directive in any component that uses stellar-hooks
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">StellarProvider</span>
            <p className="text-gray-600">
              Wrap your app with this in a client component to provide network config
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">useFreighter</span>
            <p className="text-gray-600">
              For wallet-specific functionality, use wallet hooks in client components
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">SSR-safe</span>
            <p className="text-gray-600">
              Hooks check for <code>window</code> availability before accessing browser APIs
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
