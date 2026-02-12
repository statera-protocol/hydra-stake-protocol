import { describe, it, expect } from "vitest";
import { HydraStakeSimulator } from "./hydra-staking-setup";
import {
  createArrayFromMapping,
  HydraStakePrivateState,
  LedgerMapItem,
} from "../src/witnesses";
import {
  Stake,
  StakePoolStatus,
} from "../src/managed/hydra-stake-protocol/contract/index.js";
import { encodeRawTokenType, nativeToken } from "@midnight-ntwrk/ledger-v7";
import { toHex } from "@midnight-ntwrk/compact-runtime";

const createFTUnshieldedLendingContract = (
  name?: string
): HydraStakeSimulator => {
  const simulator = HydraStakeSimulator.deployFTLendingUnshieldedContract();
  const ledgerState = simulator.getLedgerState();
  expect(ledgerState.protocolTVL.value).toBe(BigInt(0));
  expect(ledgerState.stakings.size()).toBe(BigInt(0));
  const initPrivateState = simulator.getPrivateState();
  expect(initPrivateState.secretKey).toHaveLength(32);
  expect(initPrivateState.stakeMetadata.deposit_amount).toBe(BigInt(0));
  expect(initPrivateState.stakeMetadata.redeemable).toBe(BigInt(0));
  expect(initPrivateState.stakeMetadata.stAssets_minted).toBe(BigInt(0));
  return simulator;
};

describe("Stake, Add to Stake, Receive delgation reward & Redeem", () => {
  it("Should simulate entire stake flow excluding delegation", () => {
    let stakings: LedgerMapItem<Stake>[];
    let privateState: HydraStakePrivateState;

    const simulator = createFTUnshieldedLendingContract(
      "Staker's simulation contract"
    );

    const stakeLedgerState = simulator.stake(100);
    privateState = simulator.getPrivateState();
    expect(stakeLedgerState.stakings.size()).toBe(BigInt(1));
    stakings = createArrayFromMapping<Stake>(stakeLedgerState.stakings);
    const { state: stake } = stakings[0];

    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(100_000_000));
    expect(stakeLedgerState.total_stAsset_Minted).toBe(BigInt(100_000_000));

    const addStakeLedgerState = simulator.stake(52.45);
    privateState = simulator.getPrivateState();

    expect(addStakeLedgerState.stakings.size()).toBe(BigInt(1));
    expect(addStakeLedgerState.protocolTVL.value).toBe(BigInt(152_450_000));

    stakings = createArrayFromMapping<Stake>(addStakeLedgerState.stakings);
    const { state: updatedStake } = stakings[0];
    
    expect(addStakeLedgerState.protocolTVL.value).toBe(BigInt(152_450_000));
    expect(addStakeLedgerState.total_stAsset_Minted).toBe(BigInt(152_450_000));
    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(152_450_000));

    const recieveRewardLedgerState = simulator.receiveDelegateReward(20);

    expect(recieveRewardLedgerState.protocolTVL.value).toBe(
      BigInt(172_450_000)
    );

    expect(recieveRewardLedgerState.total_rewards_accrued).toBe(
      BigInt(20_000_000)
    );

    const newledger = simulator.setCoinColor();

    expect(
      toHex(simulator.stCoin(10).color) === toHex(newledger.stAssetCoinColor)
    ).toBe(true)
    
    
    const redeemLedgerState = simulator.redeem(152.45);
    privateState = simulator.getPrivateState();
    
    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(0));
    expect(privateState.stakeMetadata.redeemable).toBe(BigInt(0));
    expect(redeemLedgerState.protocolTVL.value).toBe(BigInt(85));
  });
});

describe("Stake & Delegate protocol balance to third party contract", () => {
  it("Should simulate stake flow upto delgation", () => {
    let stakings: LedgerMapItem<Stake>[];
    let privateState: HydraStakePrivateState;

    const simulator = createFTUnshieldedLendingContract(
      "Delegation simulation contract"
    );

    const stakeLedgerState = simulator.stake(100);
    privateState = simulator.getPrivateState();
    expect(stakeLedgerState.stakings.size()).toBe(BigInt(1));
    stakings = createArrayFromMapping<Stake>(stakeLedgerState.stakings);
    const { state: stake } = stakings[0];

    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(100_000_000));
    expect(stakeLedgerState.total_stAsset_Minted).toBe(BigInt(100_000_000));

    const delegationStakeLedgerState = simulator.delegate();
    
    expect(delegationStakeLedgerState.stakePoolStatus).toBe(
      StakePoolStatus.delegated
    );
    expect(delegationStakeLedgerState.protocolTVL.value).toBe(
      BigInt(100000000)
    );
  });
});
