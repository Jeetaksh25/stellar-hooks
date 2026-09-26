import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type StellarNetwork = "testnet" | "futurenet" | "mainnet";

export interface NetworkContextValue {
  network: StellarNetwork;
  setNetwork: (network: StellarNetwork) => void;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

export interface NetworkProviderProps {
  children: ReactNode;
  initialNetwork?: StellarNetwork;
}

export function NetworkProvider({
  children,
  initialNetwork = "testnet",
}: NetworkProviderProps) {
  const [network, setNetworkState] =
    useState<StellarNetwork>(initialNetwork);

  const setNetwork = useCallback((nextNetwork: StellarNetwork) => {
    setNetworkState(nextNetwork);
  }, []);

  const value = useMemo(
    () => ({
      network,
      setNetwork,
    }),
    [network, setNetwork],
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkSwitcher(): NetworkContextValue {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error(
      "useNetworkSwitcher must be used within a NetworkProvider",
    );
  }

  return context;
}
