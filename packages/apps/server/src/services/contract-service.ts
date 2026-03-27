import { DynamicContractAPI, utils } from "nite-api";

import { Contract, createNightStakingPrivateState, witnesses } from "../contract-build/index.js";
import type { NightStakingContract, NightStakingPrivateStateId, WalletContext } from "../types/common-types.js";
import { config } from "../utils/config.js";
import { buildWalletFromSeed, configureProviders } from "../utils/wallet-utils.js";

const PRIVATE_STATE_ID: NightStakingPrivateStateId = "nightStakingPrivateState";

export let contractApi: DynamicContractAPI<NightStakingContract, NightStakingPrivateStateId> | undefined;

const compiledContract = utils.createCompiledContract<NightStakingContract>(
  "night-staking",
  Contract,
  witnesses,
  config.zkConfigPath,
);

let walletContextPromise: Promise<WalletContext> | undefined;

const getWalletContext = (): Promise<WalletContext> => {
  walletContextPromise ??= buildWalletFromSeed(config);
  return walletContextPromise;
};

const getProviders = async () => {
  const walletContext = await getWalletContext();
  return configureProviders<NightStakingContract, NightStakingPrivateStateId>(
    walletContext,
    config,
    config.zkConfigPath,
  );
};

export async function deployNewStakeContract() {
  const providers = await getProviders();
  const api = await DynamicContractAPI.deploy<NightStakingContract, NightStakingPrivateStateId>({
    providers,
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createNightStakingPrivateState(),
  });

  contractApi = api;
  return api;
}

export async function establishContractConnection(contractAddress = process.env.CONTRACT_ADDRESS) {
  if (contractApi !== undefined) {
    return contractApi;
  }

  if (contractAddress == null || contractAddress.trim() === "") {
    throw new Error("CONTRACT_ADDRESS is required to join an existing night staking contract");
  }

  const providers = await getProviders();
  const api = await DynamicContractAPI.join<NightStakingContract, NightStakingPrivateStateId>({
    providers,
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: createNightStakingPrivateState(),
    contractAddress: contractAddress.trim(),
  });

  contractApi = api;
  return api;
}
