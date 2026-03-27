import {
  Ledger,
  CustomStructs_StakePrivateState,
} from "./managed/hydra-stake-protocol/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type HydraStakePrivateState = {
  readonly secretKey: Uint8Array;
  readonly stakeMetadata: CustomStructs_StakePrivateState;
};

export interface LedgerMapItem<T> {
  key: Uint8Array;
  state: T;
}

export interface LedgerMap<T> {
  isEmpty(): boolean;
  size(): bigint;
  member(key_0: Uint8Array<ArrayBufferLike>): boolean;
  lookup(key_0: Uint8Array): T;
  [Symbol.iterator](): Iterator<[Uint8Array, T]>;
}

export const createArrayFromMapping = <T>(
  mapping: LedgerMap<T>
): LedgerMapItem<T>[] => {
  return Array.from(mapping).map(([key, state]) => ({
    key: key,
    state: state,
  }));
};

export const createHydraStakePrivateState = (
  secretKey: Uint8Array
): HydraStakePrivateState => ({
  secretKey,
  stakeMetadata: {
    deposit_amount: 0n,
    stAssets_minted: 0n,
    redeemable: 0n,
  },
});

export const witnesses = {
  secreteKey: (
    state: WitnessContext<Ledger, HydraStakePrivateState>
  ): [HydraStakePrivateState, Uint8Array] => {
    state.privateState.secretKey;
    return [state.privateState, state.privateState.secretKey];
  },

  divide: (
    { privateState }: WitnessContext<Ledger, HydraStakePrivateState>,
    numerator: bigint, //Scalled by 1_000_000n
    denominator: bigint //Scalled by 1_000_000n
  ): [HydraStakePrivateState, [bigint, bigint]] => {
    if (numerator == 0n) throw new Error("Invalid division arithemetics");
    const quotient = numerator / denominator;
    const remainder = numerator % denominator;

    return [privateState, [quotient, remainder]];
  },

  getStakePrivateState: ({
    privateState,
  }: WitnessContext<Ledger, HydraStakePrivateState>): [
      HydraStakePrivateState,
      CustomStructs_StakePrivateState,
    ] => {
    return [privateState, privateState.stakeMetadata];
  },

  updateStakePrivateState: (
    { privateState }: WitnessContext<Ledger, HydraStakePrivateState>,
    metadata: CustomStructs_StakePrivateState
  ): [HydraStakePrivateState, []] => {
    const newPrivateState = {
      ...privateState,
      stakeMetadata: {
        ...privateState.stakeMetadata,
        ...metadata,
      },
    };
    return [newPrivateState, []];
  },

  getCurrentTime: ({
    privateState,
  }: WitnessContext<Ledger, HydraStakePrivateState>): [
      HydraStakePrivateState,
      bigint,
    ] => {
    return [privateState, BigInt(Date.now())];
  }
};
