import type { Metadata } from "next";
import { StellarWalletProvider } from "@/components/stellar-provider";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "stellar-hooks · Next.js App Router",
  description:
    "Minimal example demonstrating the correct client/server boundary when using stellar-hooks in the Next.js App Router.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // This layout is a Server Component: it renders static metadata and mounts
  // the tree. It never accesses browser APIs or wallet state -- that stays in
  // the client children below.
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="font-bold text-xl text-gray-900">
                    stellar-hooks
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/"
                    className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/transfers"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Transfers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* The provider is a Client Component (it holds wallet state). Wrapping
              children here keeps all hook usage on the client while the rest of
              the tree remains server-rendered. */}
          <StellarWalletProvider>{children}</StellarWalletProvider>
        </main>
      </body>
    </html>
  );
}
