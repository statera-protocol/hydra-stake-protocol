import { describe, it, expect } from "vitest";
import { HydraStakeSimulator } from "./hydra-staking-setup";
import { uint8arraytostring } from "./utils";
import {
  createArrayFromMapping,
  HydraStakePrivateState,
  LedgerMapItem,
} from "../witnesses";
import {
  Stake,
  CustomStructs_StakePoolStatus,
} from "../managed/hydra-stake-protocol/contract/index.cjs";

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
  console.log("===================================================");
  console.log(`${name} Deployment Successful 🎉 `);
  console.log("===================================================");
  console.log("- Current Stakings", ledgerState.stakings.size());
  console.log("- Current TVL", ledgerState.protocolTVL.value);
  console.log(
    "Current valid asset type",
    uint8arraytostring(ledgerState.validAssetCoinType)
  );
  return simulator;
};

describe("Stake, Add to Stake, Receive delgation reward & Redeem", () => {
  it("Should simulate entire stake flow excluding delgation", () => {
    let stakings: LedgerMapItem<Stake>[];
    let privateState: HydraStakePrivateState;

    const simulator = createFTUnshieldedLendingContract(
      "Staker's simulation contract"
    );

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* STAKE ASSET IN POOL *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );

    const stakeLedgerState = simulator.stake(100);
    privateState = simulator.getPrivateState();
    expect(stakeLedgerState.stakings.size()).toBe(BigInt(1));
    stakings = createArrayFromMapping<Stake>(stakeLedgerState.stakings);
    const { state: stake } = stakings[0];
    console.log("===================================================");
    console.log("Staking List: After staking to pool ✅");
    console.log("===================================================");
    console.log("Current staker", stake);
    console.log("===================================================");
    console.log("Protocol TVL state: After staking from pool 💰");
    console.log("===================================================");
    console.log("- Current pool balance", stakeLedgerState.protocolTVL.value);
    console.log(
      "- Current TVL coin color",
      uint8arraytostring(stakeLedgerState.protocolTVL.color)
    );
    console.log("===================================================");
    console.log("Private state: After staking to pool 🗝️");
    console.log("===================================================");
    console.log("- Current private state", privateState);
    console.log("Current total mint", stakeLedgerState.totalAssetMinted);

    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(100_000_000));
    expect(stakeLedgerState.totalAssetMinted).toBe(BigInt(100_000_000));

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* ADD TO STAKE ASSET IN POOL *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );

    const addStakeLedgerState = simulator.stake(52.45);
    privateState = simulator.getPrivateState();

    expect(addStakeLedgerState.stakings.size()).toBe(BigInt(1));
    expect(addStakeLedgerState.protocolTVL.value).toBe(BigInt(152_450_000));

    stakings = createArrayFromMapping<Stake>(addStakeLedgerState.stakings);
    const { state: updatedStake } = stakings[0];
    console.log("===================================================");
    console.log("Staking List: After staking to pool ✅");
    console.log("===================================================");
    console.log("Current staker", updatedStake);
    console.log("===================================================");
    console.log("Protocol TVL state: After adding more stake asset pool 💰");
    console.log("===================================================");
    console.log(
      "- Current pool balance",
      addStakeLedgerState.protocolTVL.value
    );
    console.log(
      "- Current TVL coin color",
      uint8arraytostring(addStakeLedgerState.protocolTVL.color)
    );
    console.log("===================================================");
    console.log("Private state: After adding staking to pool 🗝️");
    console.log("===================================================");
    console.log("- Current private state", privateState);
    console.log("Current total mint", addStakeLedgerState.totalAssetMinted);

    expect(addStakeLedgerState.protocolTVL.value).toBe(BigInt(152_450_000));
    expect(addStakeLedgerState.totalAssetMinted).toBe(BigInt(152_450_000));
    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(152_450_000));

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* RECIEVE DELEGATE REWARD *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );

    const recieveRewardLedgerState = simulator.receiveDelegateReward(20);

    expect(recieveRewardLedgerState.protocolTVL.value).toBe(
      BigInt(172_450_000)
    );
    console.log("===================================================");
    console.log("Protocol TVL after adding reward to pool 💰");
    console.log("===================================================");
    console.log(
      "- Current pool balance",
      recieveRewardLedgerState.protocolTVL.value
    );
    console.log(
      "- Current TVL coin color",
      uint8arraytostring(recieveRewardLedgerState.protocolTVL.color)
    );
    console.log(
      "Total reward accrued",
      recieveRewardLedgerState.totalRewardsAccrued
    );

    expect(recieveRewardLedgerState.totalRewardsAccrued).toBe(
      BigInt(20_000_000)
    );

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* SET COIN COLOR FOR sTCOIN *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );
    const setColorLedgerState = simulator.setCoinColor();
    console.log("===================================================");
    console.log("stCoin color after setting coin type (ADMIN ONLY)💰");
    console.log("===================================================");
    console.log(
      "- Current ",
      uint8arraytostring(setColorLedgerState.stAssetCoinColor)
    );

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* REDEEM STKAED ASSET *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );
    const redeemLedgerState = simulator.redeem(152.45);
    privateState = simulator.getPrivateState();
    console.log("===================================================");
    console.log("Protocol TVL after redeeming stake plus reward to pool 💰");
    console.log("===================================================");
    console.log("- Current pool balance", redeemLedgerState.protocolTVL.value);
    console.log(
      "- Current TVL coin color",
      uint8arraytostring(redeemLedgerState.protocolTVL.color)
    );
    console.log(
      "Total reward accrued",
      redeemLedgerState.totalRewardsAccrued
    );
    console.log("===================================================");
    console.log("Private state: After staking to pool 🗝️");
    console.log("===================================================");
    console.log("- Current private state", privateState);
    console.log("Current total mint", addStakeLedgerState.totalAssetMinted);

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

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* STAKE ASSET IN POOL *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );

    const stakeLedgerState = simulator.stake(100);
    privateState = simulator.getPrivateState();
    expect(stakeLedgerState.stakings.size()).toBe(BigInt(1));
    stakings = createArrayFromMapping<Stake>(stakeLedgerState.stakings);
    const { state: stake } = stakings[0];
    console.log("===================================================");
    console.log("Staking List: After staking to pool ✅");
    console.log("===================================================");
    console.log("Current staker", stake);
    console.log("===================================================");
    console.log("Protocol TVL state: After staking from pool 💰");
    console.log("===================================================");
    console.log("- Current pool balance", stakeLedgerState.protocolTVL.value);
    console.log(
      "- Current TVL coin color",
      uint8arraytostring(stakeLedgerState.protocolTVL.color)
    );
    console.log("===================================================");
    console.log("Private state: After staking to pool 🗝️");
    console.log("===================================================");
    console.log("- Current private state", privateState);
    console.log("Current total mint", stakeLedgerState.totalAssetMinted);

    expect(privateState.stakeMetadata.deposit_amount).toBe(BigInt(100_000_000));
    expect(stakeLedgerState.totalAssetMinted).toBe(BigInt(100_000_000));

    console.log(
      "================================================================================================================================="
    );
    console.log(
      "/********************* ADD TO STAKE ASSET IN POOL *****************************/"
    );
    console.log(
      "================================================================================================================================="
    );

    const delegationStakeLedgerState = simulator.delegate();
    console.log("===================================================");
    console.log("Protocol TVL state: After delegating to third party 💰");
    console.log("===================================================");
    console.log(
      "- Current pool balance",
      delegationStakeLedgerState.protocolTVL.value
    );
    console.log(
      "- Current TVL coin color",
      uint8arraytostring(delegationStakeLedgerState.protocolTVL.color)
    );
    console.log("===================================================");
    console.log("🚥 Stake pool status after delegation");
    console.log("===================================================");
    console.log(
      "Pool balance status: ",
      delegationStakeLedgerState.stakePoolStatus == CustomStructs_StakePoolStatus.delegated
        ? "DELEGATED"
        : "AVAIBLE"
    );
    expect(delegationStakeLedgerState.stakePoolStatus).toBe(CustomStructs_StakePoolStatus.delegated);
    expect(delegationStakeLedgerState.protocolTVL.value).toBe(BigInt(100000000));
  });
});
