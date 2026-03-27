import { MerkleTreePath, toHex, WitnessContext } from "@midnight-ntwrk/compact-runtime";
import { Ledger, Stake } from "./managed/night-staking/contract/index.js"

export interface NightStakingPrivatState {
    secretKey: Uint8Array;
    stakes: Record<string, Stake>
}

export const createNightStakingPrivateState = (
    secretKey: Uint8Array = crypto.getRandomValues(new Uint8Array(32))
): NightStakingPrivatState => ({
    secretKey,
    stakes: {}
});

export const witnesses = {
    secretKey: (
        { privateState }: WitnessContext<Ledger, NightStakingPrivatState>
    ): [
        NightStakingPrivatState,
        Uint8Array
    ] => [privateState, privateState.secretKey],

    getFirstFreeMerkleTreeIndex: (
        { privateState, ledger }: WitnessContext<Ledger, NightStakingPrivatState>
    ): [
        NightStakingPrivatState,
        bigint
    ] => {
        const firstFreeIndex = ledger.stakes.firstFree();
        console.log(`First-Free-Index: `, firstFreeIndex);
        return [privateState, firstFreeIndex]
    },

    getStakeMetadata: (
        { privateState }: WitnessContext<Ledger, NightStakingPrivatState>,
        encAddress: Uint8Array
    ): [
            NightStakingPrivatState,
            {
                is_some: boolean,
                value: Stake
            }
        ] => {
        const stakePosition = privateState.stakes[toHex(encAddress)];

        if (stakePosition) {
            return [privateState, {
                is_some: true,
                value: stakePosition
            }]

        }

        return [privateState, {
            is_some: false,
            value: {
                status: 0,
                amount: 0n,
                mt_index: 0n,
                lock_until_epoch: 0n,
                encAddress: new Uint8Array(32).fill(0)
            }
        }]
    },

    updateStakeMetadata: (
        { privateState }: WitnessContext<Ledger, NightStakingPrivatState>,
        encAddress: Uint8Array,
        newStake: Stake
    ): [NightStakingPrivatState, []] => {

        const updatedPrivateState = {
            ...privateState,
            stakes: {
                ...privateState.stakes,
                [toHex(encAddress)]: newStake
            }
        };

        return [updatedPrivateState, []]
    },

    getCurrentTime: (
        { privateState }: WitnessContext<Ledger, NightStakingPrivatState>
    ): [
        NightStakingPrivatState,
        bigint
    ] => {
        const currentTimeInMilliseconds = BigInt(Date.now());

        return [privateState, currentTimeInMilliseconds]
    },

    verifyStakeCommit: (
        { privateState, ledger }: WitnessContext<Ledger, NightStakingPrivatState>,
        commitHash: Uint8Array,
        mtIndex: bigint
    ): [
        NightStakingPrivatState,
        MerkleTreePath<Uint8Array>
    ] => {
        const path = ledger.stakes.pathForLeaf(mtIndex, commitHash);

        return [privateState, path]
    },

    getCurrentEpoch: (
        { privateState, ledger }: WitnessContext<Ledger, NightStakingPrivatState>,
    ): [
        NightStakingPrivatState,
        [boolean, bigint]
    ] => {
        const epochDuration = ledger.EPOCH_DURATION;
        const startTime = ledger.START_TIME;
        const currentTimeInMilliseconds = BigInt(Date.now());
        const elapsedTime = currentTimeInMilliseconds > startTime
            ? currentTimeInMilliseconds - startTime
            : 0n;
        const currentEpochInDays = elapsedTime / epochDuration;
        const isNewEpoch = currentEpochInDays > ledger.currentEpoch;

        return [privateState, [isNewEpoch, currentEpochInDays]]
    },
}
