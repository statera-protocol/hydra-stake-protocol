"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import {
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  take,
  tap,
  throwError,
  timeout,
} from "rxjs";
import {
  ConnectedAPI,
  InitialAPI,
  Configuration,
  ConnectionStatus,
} from "@midnight-ntwrk/dapp-connector-api";
import semver from "semver";
import { pipe as fnPipe } from "fp-ts/function";
import { Logger } from "pino";
import { DynamicProviders } from "nite-api";
import {
  CircuitKeys,
  NightStakingContractType,
  NightStakingPrivateStateId,
} from "@/types/common-types";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import {
  MidnightProvider,
  PrivateStateProvider,
  WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { fromHex, toHex } from "@midnight-ntwrk/compact-runtime";
import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
  TransactionId,
} from "@midnight-ntwrk/ledger-v7";
import { UnboundTransaction } from "@midnight-ntwrk/midnight-js-types";

interface WalletContextType {
  isConnecting: boolean;
  isConnected: boolean;
  walletAddress: string | null;
  walletApi: ConnectedAPI | undefined;
  connect: () => void;
  disconnect: () => void;
  providers:
    | DynamicProviders<NightStakingContractType, NightStakingPrivateStateId>
    | undefined;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

/** @internal */
const getFirstCompatibleWallet = (): InitialAPI | undefined => {
  if (!window?.midnight) return undefined;
  return Object.values(window.midnight).find(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === "object" &&
      "apiVersion" in wallet &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

const COMPATIBLE_CONNECTOR_API_VERSION = "4.x";

/** @internal */
const connectToWallet = (
  networkId: string,
  logger?: Logger,
): Promise<ConnectedAPI> => {
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => getFirstCompatibleWallet()),
      tap((connectorAPI) => {
        console.info(connectorAPI, "Check for wallet connector API");
      }),
      filter((connectorAPI): connectorAPI is InitialAPI => !!connectorAPI),
      tap((connectorAPI) => {
        console.info(
          connectorAPI,
          "Compatible wallet connector API found. Connecting.",
        );
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            console.error("Could not find wallet connector API");

            return new Error(
              "Could not find Midnight Lace wallet. Extension installed?",
            );
          }),
      }),
      concatMap(async (initialAPI) => {
        const connectedAPI = await initialAPI.connect(networkId);
        const connectionStatus = await connectedAPI.getConnectionStatus();
        console.info(connectionStatus, "Wallet connector API enabled status");
        return connectedAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            console.error("Wallet connector API has failed to respond");

            return new Error(
              "Midnight Lace wallet has failed to respond. Extension enabled?",
            );
          }),
      }),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              console.error("Unable to enable connector API" + error);
              return new Error("Application is not authorized");
            })
          : apis,
      ),
    ),
  );
};

export const createWalletAndMidnightProvider = async (
  walletApi: ConnectedAPI,
): Promise<WalletProvider & MidnightProvider> => {
  const shieldedAddresses = await walletApi.getShieldedAddresses();
  return {
    getCoinPublicKey() {
      return shieldedAddresses.shieldedCoinPublicKey;
    },
    getEncryptionPublicKey() {
      return shieldedAddresses.shieldedEncryptionPublicKey;
    },
    balanceTx: async (
      tx: UnboundTransaction,
      ttl?: Date,
    ): Promise<FinalizedTransaction> => {
      try {
        console.info({ tx, ttl }, "Balancing transaction via wallet");
        const serializedTx = toHex(tx.serialize());
        const received =
          await walletApi.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          "signature",
          "proof",
          "binding",
          fromHex(received.tx),
        );
      } catch (e) {
        console.error({ error: e }, "Error balancing transaction via wallet");
        throw e;
      }
    },
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      await walletApi.submitTransaction(toHex(tx.serialize()));
      const txIdentifiers = tx.identifiers();
      const txId = txIdentifiers[0]; // Return the first transaction ID
      console.info({ txIdentifiers }, "Submitted transaction via wallet");
      return txId;
    },
  };
};

const createInMemoryPrivateStateProvider = <
  PSI extends NightStakingPrivateStateId,
  PS = unknown,
>(): PrivateStateProvider<PSI, PS> => {
  const privateStates = new Map<PSI, PS>();
  const signingKeys = new Map<string, unknown>();

  return {
    async get(privateStateId) {
      return privateStates.get(privateStateId) ?? null;
    },
    async set(privateStateId, state) {
      privateStates.set(privateStateId, state);
    },
    async remove(privateStateId) {
      privateStates.delete(privateStateId);
    },
    async clear() {
      privateStates.clear();
    },
    async getSigningKey(address) {
      return (
        (signingKeys.get(address) as Awaited<
          ReturnType<PrivateStateProvider<PSI, PS>["getSigningKey"]>
        >) ?? null
      );
    },
    async setSigningKey(address, signingKey) {
      signingKeys.set(address, signingKey);
    },
    async removeSigningKey(address) {
      signingKeys.delete(address);
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
  };
};

export const configureProviders = async (
  walletApi: ConnectedAPI,
): Promise<
  DynamicProviders<NightStakingContractType, NightStakingPrivateStateId>
> => {
  const { indexerPublicDataProvider } =
    await import("@midnight-ntwrk/midnight-js-indexer-public-data-provider");
  const zkConfigPath = window.location.origin;
  const zkConfigProvider = new FetchZkConfigProvider<CircuitKeys>(
    zkConfigPath,
    fetch.bind(window),
  );
  const walletAndMidnightProvider =
    await createWalletAndMidnightProvider(walletApi);
  const configurations = await walletApi.getConfiguration();
  return {
    privateStateProvider: createInMemoryPrivateStateProvider(),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
    proofProvider: httpClientProofProvider(
      configurations.proverServerUri!,
      zkConfigProvider,
    ),
    zkConfigProvider,
    publicDataProvider: indexerPublicDataProvider(
      configurations.indexerUri,
      configurations.indexerWsUri,
    ),
  };
};

export const WalletApiSessionKey = "mn_wallet_api";
export const WalletConnectionSessionKey = "mn_wallet_connection_status";

export function WalletStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [providers, setProviders] = useState<
    | DynamicProviders<NightStakingContractType, NightStakingPrivateStateId>
    | undefined
  >();
  const [isConnected, setIsConnected] = useState(() => {
    const existingConnectionStatus = sessionStorage.getItem(
      WalletConnectionSessionKey,
    );
    return existingConnectionStatus
      ? JSON.parse(existingConnectionStatus)
      : false;
  });

  const [walletApi, setWalletApi] = useState<ConnectedAPI | undefined>();

  /** Enable connection to lace wallet */
  const connect = async () => {
    setIsConnecting(true);
    const networkId = String(process.env.NEXT_PUBLIC_NETWORK_ID);

    if (networkId == undefined || networkId == "") {
      throw new Error(`Failed to find networkId: ${networkId}`);
    }

    if (isConnected == true && walletApi) {
      setIsConnecting(false);
      setWalletAddress(
        (await walletApi.getUnshieldedAddress()).unshieldedAddress,
      );
      setProviders(await configureProviders(walletApi));
    }

    try {
      const connectedWalletApi = await connectToWallet(networkId);
      console.log("Connected Wallet API:", connectedWalletApi);
      setIsConnecting(false);
      setWalletAddress(
        (await connectedWalletApi.getUnshieldedAddress()).unshieldedAddress,
      );
      setWalletApi(connectedWalletApi);
      setIsConnected(true);
      setProviders(await configureProviders(connectedWalletApi));
      sessionStorage.setItem(WalletConnectionSessionKey, JSON.stringify(true));
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : `Unknown error occured`;
      console.log(errMsg);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setWalletAddress(null);
  };

  useEffect(() => {
    (async () => {
      if (!isConnected) return;

      await connect();
    })();
  }, [isConnected]);

  return (
    <WalletContext.Provider
      value={{
        isConnecting,
        isConnected,
        walletAddress,
        connect,
        disconnect,
        walletApi,
        providers,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  
  return context;
}
