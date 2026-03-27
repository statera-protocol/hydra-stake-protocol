import { MerkleTreePath, WitnessContext } from "@midnight-ntwrk/compact-runtime";
import { Ledger, Stake } from "./managed/night-staking/contract/index.js";
export interface NightStakingPrivatState {
    secretKey: Uint8Array;
    stakes: Record<string, Stake>;
}
export declare const createNightStakingPrivateState: (secretKey?: Uint8Array) => NightStakingPrivatState;
export declare const witnesses: {
    secretKey: ({ privateState }: WitnessContext<Ledger, NightStakingPrivatState>) => [NightStakingPrivatState, Uint8Array];
    getFirstFreeMerkleTreeIndex: ({ privateState, ledger }: WitnessContext<Ledger, NightStakingPrivatState>) => [NightStakingPrivatState, bigint];
    getStakeMetadata: ({ privateState }: WitnessContext<Ledger, NightStakingPrivatState>, encAddress: Uint8Array) => [NightStakingPrivatState, {
        is_some: boolean;
        value: Stake;
    }];
    updateStakeMetadata: ({ privateState }: WitnessContext<Ledger, NightStakingPrivatState>, encAddress: Uint8Array, newStake: Stake) => [NightStakingPrivatState, []];
    getCurrentTime: ({ privateState }: WitnessContext<Ledger, NightStakingPrivatState>) => [NightStakingPrivatState, bigint];
    verifyStakeCommit: ({ privateState, ledger }: WitnessContext<Ledger, NightStakingPrivatState>, commitHash: Uint8Array, mtIndex: bigint) => [NightStakingPrivatState, MerkleTreePath<Uint8Array>];
    getCurrentEpoch: ({ privateState, ledger }: WitnessContext<Ledger, NightStakingPrivatState>) => [NightStakingPrivatState, [boolean, bigint]];
};
