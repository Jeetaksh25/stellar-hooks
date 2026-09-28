import {
  signTransaction as freighterSignTx,
  signAuthEntry as freighterSignAuthEntry,
  signMessage as freighterSignMessage,
} from "@stellar/freighter-api";
import {
  normalizeIsConnected,
  normalizeRequestAccess,
} from "./freighter-normalization";
import type { WalletAdapter, WalletConnectionState } from "./types";
import { UserRejectedError, isUserRejectionMessage } from "../utils/errors";

export function createFreighterAdapter(): WalletAdapter {
  // Track connection state locally so `getState()` never returns an ambiguous
  // undefined — satisfies the strict-null requirement from issue #832.
  let _connectedPublicKey: string | null = null;

  return {
    id: "freighter",
    name: "Freighter",
    meta: {
      name: "Freighter",
      description: "Stellar browser extension wallet by the Stellar Development Foundation.",
      iconUrl: "https://raw.githubusercontent.com/stellar/freighter/main/extension/src/popup/assets/logo.svg",
      installUrl: "https://www.freighter.app",
      supportsSignMessage: true,
      supportsSignAuthEntry: true,
    },

    isInstalled(): boolean {
      return typeof window !== "undefined" && !!(window as unknown as { __FREIGHTER__?: unknown }).__FREIGHTER__;
    },

    /**
     * Connects to Freighter. Returns the public key on success, or `null` if
     * the user denies access or no address is returned — callers must handle
     * the `null` case explicitly (issue #832).
     */
    async connect(): Promise<string | null> {
      const { address, error } = await normalizeRequestAccess();
      if (error) throw error;
      if (!address) return null;
      _connectedPublicKey = address;
      return address;
    },

    disconnect(): void {
      // Freighter does not expose a programmatic disconnect
      _connectedPublicKey = null;
    },

    /**
     * Returns an explicitly-typed discriminated-union state object so callers
     * can never accidentally access `publicKey` without first checking
     * `isConnected` (issue #832).
     */
    getState(): WalletConnectionState {
      if (_connectedPublicKey) {
        return { isConnected: true, publicKey: _connectedPublicKey, networkPassphrase: null };
      }
      return { isConnected: false, publicKey: null, networkPassphrase: null };
    },

    async signTransaction(xdr: string, opts?: { networkPassphrase?: string }): Promise<string> {
      const { signedTxXdr, error } = await freighterSignTx(xdr, {
        ...(opts?.networkPassphrase && { networkPassphrase: opts.networkPassphrase }),
      });
      if (error) {
        throw isUserRejectionMessage(error.message)
          ? new UserRejectedError(error.message, { cause: error, walletId: "freighter", operation: "signTransaction" })
          : new Error(error.message);
      }
      return signedTxXdr;
    },

    async signMessage(message: string, opts?: { accountToSign?: string }): Promise<string> {
      const address = opts?.accountToSign;
      const { signedMessage, error } = await freighterSignMessage(message, {
        ...(address && { address }),
      });
      if (error) {
        throw isUserRejectionMessage(error.message)
          ? new UserRejectedError(error.message, { cause: error, walletId: "freighter", operation: "signMessage" })
          : new Error(error.message);
      }
      if (!signedMessage) throw new Error("No signed message returned from Freighter");
      return signedMessage.toString();
    },

    async signAuthEntry(entryPreimageXdr: string): Promise<string> {
      const { signedAuthEntry, error } = await freighterSignAuthEntry(entryPreimageXdr);
      if (error) {
        throw isUserRejectionMessage(error.message)
          ? new UserRejectedError(error.message, { cause: error, walletId: "freighter", operation: "signAuthEntry" })
          : new Error(error.message);
      }
      if (!signedAuthEntry) throw new Error("No signed auth entry returned from Freighter");
      return signedAuthEntry;
    },
  };
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected: connected } = await normalizeIsConnected();
    return !!connected;
  } catch {
    return false;
  }
}
