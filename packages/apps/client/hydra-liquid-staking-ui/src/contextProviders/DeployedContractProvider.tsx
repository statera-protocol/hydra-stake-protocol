import useMidnightWallet from "@/hooks/useMidnightWallet";
// import type { HydraStakePrivateState } from "@hydra/hydra-stake-protocol";

import type { Logger } from "pino";
import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import useDappContext from "@/hooks/useDappContext";
import {
  HydraAPI,
  type DeployedHydraAPI,
  type DerivedHydraStakeContractState,
} from "@hydra/hydra-stake-api";

export interface DeploymentProvider {
  // readonly userRole: "admin" | "user";
  readonly isJoining: boolean;
  readonly error: string | null;
  readonly hasJoined: boolean;
  readonly deployedHydraAPI: DeployedHydraAPI | undefined;
  readonly contractState: DerivedHydraStakeContractState | undefined;
  onJoinContract: () => Promise<void>;
  clearError: () => void;
}

export const DeployedContractContext = createContext<DeploymentProvider | null>(
  null
);

interface DeployedContractProviderProps extends PropsWithChildren {
  logger?: Logger;
  contractAddress?: string;
}

export const DeployedContractProvider = ({
  children,
  contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS,
}: DeployedContractProviderProps) => {
  const [deployedHydraAPI, setHydraAPI] = useState<
    DeployedHydraAPI | undefined
  >(undefined);
  const notification = useDappContext();
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [contractState, setContractState] = useState<
    DerivedHydraStakeContractState | undefined
  >(undefined);
  const [hasJoined, setHasJoined] = useState<boolean>(false);

  // const [userRole, setUserRole] = useState<"admin" | "user">("user");

  // Use the custom hook instead of useContext directly
  const walletContext = useMidnightWallet();

  const sendNotification = (
    message: string,
    type: "error" | "success" = "success"
  ) => {
    !notification
      ? console.log(message)
      : notification.setNotification({
          type,
          message,
        });
  };

  const onJoinContract = async () => {
    console.log("Starting to join contract");
    // Prevent multiple simultaneous joins
    if (isJoining || hasJoined) return;

    // Validate requirements
    if (walletContext == undefined) {
      setError("Wallet must be connected before joining contract");
      return;
    }

    if (!contractAddress) {
      setError("Contract address not configured");

      sendNotification("Contract address not configured");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const deployedAPI = await HydraAPI.joinHydraStakeContract(
        walletContext,
        contractAddress
      );
      console.log("Deployed contract", deployedAPI);
      setHydraAPI(deployedAPI);
      sendNotification("Onboarded successfully", "success");
      setHasJoined(true);
      console.info("Successfully joined contract", { contractAddress });
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : `Failed to join contract at ${contractAddress}`;
      setError(errMsg);
      sendNotification(errMsg, "error");
      console.error("Failed to join contract", {
        error: errMsg,
        contractAddress,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (!deployedHydraAPI) return;

    const stateSubscription = deployedHydraAPI.state.subscribe((state) => {
      console.log("Current state", state);
      setContractState(state);
    });
    

    return () => stateSubscription.unsubscribe();
  }, [deployedHydraAPI]);

  const contextValue: DeploymentProvider = {
    isJoining,
    hasJoined,
    error,
    deployedHydraAPI,
    onJoinContract,
    clearError,
    contractState,
    // userRole,
  };

  return (
    <DeployedContractContext.Provider value={contextValue}>
      {children}
    </DeployedContractContext.Provider>
  );
};
