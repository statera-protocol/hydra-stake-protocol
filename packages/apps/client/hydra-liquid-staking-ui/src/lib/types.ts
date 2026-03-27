export interface Stake {
  id: string;
  amount: number;
  token: string;
  date: string;
  status: "active" | "unstaking" | "completed";
  apy: number;
  rewards: number;
  validator: string;
  transactionHash: string;
  completionDate?: string;
}

export interface StakeHistory {
  totalStakes: number;
  totalRewards: number;
  stakes: Stake[];
}

export interface WalletCardProps {
  isConnected: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}
export interface WalletParams {
  address: string;
  addressLegacy: string;
  coinPublicKey: string;
  coinPublicKeyLegacy: string;
  encryptionPublicKey: string;
  encryptionPublicKeyLegacy: string;
}

export interface DappWalletState {
  walletState: WalletParams;
  connectionSuccess: boolean;
  connectionError: boolean;
}

export type NotificationType = "success" | "error" | null;
