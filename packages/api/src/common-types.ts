import {
  Contract,
  Witnesses,
  HydraStakePrivateState,
  Stake,
  QualifiedCoinInfo,
  StakePoolStatus,
} from "@repo/hydra-stake-protocol";
import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export const contractAddress =
  "02002355b40f3a15136ed0eed0a977ae859d1c94f2d6975f1a8294ebed2525d4d2ff";
export const hydraStakePrivateStateId = "HydraStakePrivateState";
export type HydraStakePrivateStateId = typeof hydraStakePrivateStateId;
export type HydraStakeContract = Contract<
  HydraStakePrivateState,
  Witnesses<HydraStakePrivateState>
>;
export type TokenCircuitKeys = Exclude<
  keyof HydraStakeContract["impureCircuits"],
  number | symbol
>;
export type HydraStakeContractProviders = MidnightProviders<
  TokenCircuitKeys,
  HydraStakePrivateStateId,
  HydraStakePrivateState
>;
export type DeployedHydraStakeOnchainContract =
  FoundContract<HydraStakeContract>;

  export type DerivedHydraStakeContractState = {
  totalMint: bigint;
  protocolTVL: QualifiedCoinInfo;
  mintTokenColor: string;
  delegationContractAddress: string;
  superAdmin: string;
  admins: string[];
  stakePoolStatus: StakePoolStatus;
  stakings: DerivedStaker[];
  validAssetCoinType: string;
  scaleFactor: bigint;
  redeemable: bigint;
  stAssetMinted: bigint;
  depositAmount: bigint;
};

export type DerivedStaker = {
  id: Uint8Array;
  state: Stake;
};

export interface LedgerMapItem<T> {
  id: Uint8Array;
  state: T;
}

export interface DeploymentParams {
  validAssetContractAddress?: string;
  mintDomain: string;
  deleglationContractAddress: string;
  scaleFactor: bigint;
}
