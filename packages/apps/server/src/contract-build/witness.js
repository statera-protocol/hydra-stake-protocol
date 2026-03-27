import { toHex } from "@midnight-ntwrk/compact-runtime";
export const createNightStakingPrivateState = (secretKey = crypto.getRandomValues(new Uint8Array(32))) => ({
    secretKey,
    stakes: {}
});
export const witnesses = {
    secretKey: ({ privateState }) => [privateState, privateState.secretKey],
    getFirstFreeMerkleTreeIndex: ({ privateState, ledger }) => {
        const firstFreeIndex = ledger.stakes.firstFree();
        console.log(`First-Free-Index: `, firstFreeIndex);
        return [privateState, firstFreeIndex];
    },
    getStakeMetadata: ({ privateState }, encAddress) => {
        const stakePosition = privateState.stakes[toHex(encAddress)];
        if (stakePosition) {
            return [privateState, {
                    is_some: true,
                    value: stakePosition
                }];
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
            }];
    },
    updateStakeMetadata: ({ privateState }, encAddress, newStake) => {
        const updatedPrivateState = {
            ...privateState,
            stakes: {
                ...privateState.stakes,
                [toHex(encAddress)]: newStake
            }
        };
        return [updatedPrivateState, []];
    },
    getCurrentTime: ({ privateState }) => {
        const currentTimeInMilliseconds = BigInt(Date.now());
        return [privateState, currentTimeInMilliseconds];
    },
    verifyStakeCommit: ({ privateState, ledger }, commitHash, mtIndex) => {
        const path = ledger.stakes.pathForLeaf(mtIndex, commitHash);
        return [privateState, path];
    },
    getCurrentEpoch: ({ privateState, ledger }) => {
        const epochDuration = ledger.EPOCH_DURATION;
        const startTime = ledger.START_TIME;
        const currentTimeInMilliseconds = BigInt(Date.now());
        const elapsedTime = currentTimeInMilliseconds > startTime
            ? currentTimeInMilliseconds - startTime
            : 0n;
        const currentEpochInDays = elapsedTime / epochDuration;
        const isNewEpoch = currentEpochInDays > ledger.currentEpoch;
        return [privateState, [isNewEpoch, currentEpochInDays]];
    },
};
//# sourceMappingURL=witness.js.map