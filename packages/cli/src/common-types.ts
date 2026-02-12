import { Contract, type HydraStakePrivateState } from '@repo/hydra-stake-protocol';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { DeployedContract, FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ImpureCircuitId } from '@midnight-ntwrk/compact-js';
import {Stake, QualifiedShieldedCoinInfo, StakePoolStatus } from "@repo/hydra-stake-protocol";

export type HydraStakeCircuits = ImpureCircuitId<Contract<HydraStakePrivateState>>;

export const HydraStakePrivateStateId = 'HydraStakePrivateState';

export type HydraStakeProviders = MidnightProviders<HydraStakeCircuits, typeof HydraStakePrivateStateId, HydraStakePrivateState>;

export type HydraStakeContract = Contract<HydraStakePrivateState>;

export type DeployedHydraStakeContract = DeployedContract<HydraStakeContract> | FoundContract<HydraStakeContract>;
  
export const contractAddress = "02002355b40f3a15136ed0eed0a977ae859d1c94f2d6975f1a8294ebed2525d4d2ff";
  
export type TokenCircuitKeys = Exclude<keyof HydraStakeContract["impureCircuits"], number | symbol>;

export type DerivedHydraStakeContractState = {
    totalMint: bigint;
    protocolTVL: QualifiedShieldedCoinInfo;
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
