import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { stdin as input, stdout as output } from "node:process";
import { createInterface, type Interface } from "node:readline/promises";
import { randomBytes as nodeRandomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import WebSocket from "ws";
import { Logger } from "pino";
import type { DockerComposeEnvironment, StartedDockerComposeEnvironment } from "testcontainers";
import { firstValueFrom } from "rxjs";
import { DynamicContractAPI, utils } from "nite-api";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { encodeTokenType, nativeToken } from "@midnight-ntwrk/ledger";

import { buildWallet, createWalletAndMidnightProvider } from "./wallet-utils.js";
import { type Config, contractConfig } from "./config.js";
import {
  CIRCUIT_INTERACTION_CHOICE,
  CONTRACT_SELECTION_QUESTION,
  DEPLOY_OR_JOIN_QUESTION,
  HEADER_BANNER,
  LIQUID_STAKING_INTERACTION_CHOICE,
} from "./userChoices.js";
import { type WalletContext } from "./common-types.js";

globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

type ContractKind = "night" | "liquid";

type ContractDefinition = {
  kind: ContractKind;
  label: string;
  compiledName: string;
  distEntryPath: string;
  zkConfigPath: string;
  privateStateId: string;
  privateStateStoreName: string;
};

type LoadedContract = {
  definition: ContractDefinition;
  module: any;
};

const CONTRACTS: Record<ContractKind, ContractDefinition> = {
  night: {
    kind: "night",
    label: "Night Staking",
    compiledName: "night-staking",
    distEntryPath: contractConfig.nightStaking.distEntryPath,
    zkConfigPath: contractConfig.nightStaking.zkConfigPath,
    privateStateId: "night-staking-private-state",
    privateStateStoreName: contractConfig.nightStaking.privateStateStoreName,
  },
  liquid: {
    kind: "liquid",
    label: "Hydra Liquid Staking",
    compiledName: "hydra-stake-protocol",
    distEntryPath: contractConfig.liquidStaking.distEntryPath,
    zkConfigPath: contractConfig.liquidStaking.zkConfigPath,
    privateStateId: "hydra-liquid-staking-private-state",
    privateStateStoreName: contractConfig.liquidStaking.privateStateStoreName,
  },
};

const randomBytes = (size: number): Uint8Array =>
  new Uint8Array(nodeRandomBytes(size));

const toHex = (value: Uint8Array): string => Buffer.from(value).toString("hex");

const parseHexInput = (value: string, label: string): Uint8Array => {
  const trimmed = value.trim().replace(/^0x/, "");
  if (!/^[\da-fA-F]+$/.test(trimmed) || trimmed.length % 2 !== 0) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return new Uint8Array(Buffer.from(trimmed, "hex"));
};

const parseUintInput = (value: string, label: string): bigint => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return BigInt(trimmed);
};

const parseDecimalAmountToScaled = (
  value: string,
  scaleFactor: bigint,
  label: string,
): bigint => {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const decimals = scaleFactor.toString().length - 1;
  const paddedFraction = `${fraction}${"0".repeat(decimals)}`.slice(0, decimals);
  return BigInt(whole) * scaleFactor + BigInt(paddedFraction || "0");
};

const formatValue = (value: unknown): unknown => {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return toHex(value);
  if (Array.isArray(value)) return value.map(formatValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, formatValue(v)]),
    );
  }
  return value;
};

const loadContract = async (definition: ContractDefinition): Promise<LoadedContract> => {
  if (!existsSync(definition.distEntryPath)) {
    throw new Error(
      `${definition.label} build not found at ${definition.distEntryPath}. Build the contract package first.`,
    );
  }

  const module = await import(pathToFileURL(definition.distEntryPath).href);
  return { definition, module };
};

const selectContract = async (rli: Interface): Promise<ContractDefinition | null> => {
  while (true) {
    const choice = (await rli.question(CONTRACT_SELECTION_QUESTION)).trim();
    switch (choice) {
      case "1":
        return CONTRACTS.night;
      case "2":
        return CONTRACTS.liquid;
      case "3":
        return null;
      default:
        console.log("Invalid option. Select 1, 2, or 3.");
    }
  }
};

const displayPublicState = async (api: any): Promise<any> => {
  const [publicState] = await firstValueFrom(api.contractState as any) as [any, any];
  return publicState;
};

const displayPrivateState = async (api: any): Promise<any> => {
  const [, privateState] = await firstValueFrom(api.contractState as any) as [any, any];
  return privateState;
};

const printNightLedger = (contractModule: any, publicState: any) => {
  const ledgerState = contractModule.ledger(publicState.data);
  console.dir(
    {
      epochDuration: ledgerState.EPOCH_DURATION?.toString(),
      startTime: ledgerState.START_TIME?.toString(),
      currentEpoch: ledgerState.currentEpoch?.toString(),
      adminSignature: formatValue(ledgerState.adminSignature),
      stakes: {
        firstFree: ledgerState.stakes?.firstFree?.()?.toString?.(),
        root: formatValue(ledgerState.stakes?.root?.()),
        isFull: ledgerState.stakes?.isFull?.(),
      },
    },
    { depth: null, colors: true },
  );
};

const printLiquidLedger = (contractModule: any, publicState: any) => {
  const ledgerState = contractModule.ledger(publicState.data);
  console.dir(formatValue(ledgerState), { depth: null, colors: true });
};

const buildProviders = async (
  ctx: WalletContext,
  config: Config,
  definition: ContractDefinition,
) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx, config);
  const zkConfigProvider = new NodeZkConfigProvider(definition.zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: definition.privateStateStoreName,
      privateStoragePasswordProvider: () =>
        `${ctx.unshieldedKeystore.getBech32Address().toString()}::midnight-private-state-password`,
      accountId: ctx.unshieldedKeystore.getBech32Address().toString(),
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

const resolveContractApi = async (
  loaded: LoadedContract,
  providers: any,
  rli: Interface,
  logger: Logger,
) => {
  while (true) {
    const choice = (await rli.question(DEPLOY_OR_JOIN_QUESTION)).trim();
    const compiledContract = utils.createCompiledContract(
      loaded.definition.compiledName,
      loaded.module.Contract,
      loaded.module.witnesses,
      loaded.definition.zkConfigPath,
    );
    const initialPrivateState = loaded.definition.kind === "night"
      ? loaded.module.createNightStakingPrivateState(randomBytes(32))
      : loaded.module.createHydraStakePrivateState(randomBytes(32));

    switch (choice) {
      case "1":
        return DynamicContractAPI.deploy({
          providers,
          compiledContract,
          initialPrivateState,
          privateStateId: loaded.definition.privateStateId,
          logger: logger as any,
        });
      case "2": {
        const contractAddress = (await rli.question("Please enter the contract address: ")).trim();
        return DynamicContractAPI.join({
          providers,
          compiledContract,
          initialPrivateState,
          privateStateId: loaded.definition.privateStateId,
          contractAddress,
          logger: logger as any,
        });
      }
      case "3":
        return null;
      default:
        console.log("Invalid option. Select 1, 2, or 3.");
    }
  }
};

const callTx = async (api: any, circuitName: string, ...args: unknown[]) =>
  (api.callTx as any)(circuitName, ...args);

const promptNightStake = async (api: any, rli: Interface) => {
  const amount = parseUintInput(await rli.question("Enter stake amount (Uint64): "), "stake amount");
  const lockUntilEpoch = parseUintInput(
    await rli.question("Enter lock-until epoch (Uint64): "),
    "lock-until epoch",
  );
  const encAddress = randomBytes(32);
  console.log(`Generated encrypted address: ${toHex(encAddress)}`);
  await callTx(api, "stake", amount, lockUntilEpoch, encAddress);
};

const promptNightClaim = async (api: any, rli: Interface) => {
  const encAddress = parseHexInput(
    await rli.question("Enter the encrypted address used for staking: "),
    "encrypted address",
  );
  await callTx(api, "claim", encAddress);
};

const getLiquidLedgerState = async (contractModule: any, api: any) => {
  const [publicState] = await firstValueFrom(api.contractState as any) as [any, any];
  return contractModule.ledger(publicState.data);
};

const promptLiquidStake = async (contractModule: any, api: any, rli: Interface) => {
  const ledgerState = await getLiquidLedgerState(contractModule, api);
  const value = parseDecimalAmountToScaled(
    await rli.question("Enter stake amount: "),
    BigInt(ledgerState.SCALE_FACTOR),
    "stake amount",
  );
  await callTx(api, "stake", {
    color: encodeTokenType(nativeToken()),
    nonce: randomBytes(32),
    value,
  });
};

const promptLiquidRedeem = async (contractModule: any, api: any, rli: Interface) => {
  const ledgerState = await getLiquidLedgerState(contractModule, api);
  const value = parseDecimalAmountToScaled(
    await rli.question("Enter stAsset amount to redeem: "),
    BigInt(ledgerState.SCALE_FACTOR),
    "redeem amount",
  );
  await callTx(api, "redeem", {
    color: ledgerState.stAssetCoinColor,
    nonce: randomBytes(32),
    value,
  });
};

const promptLiquidReward = async (contractModule: any, api: any, rli: Interface) => {
  const ledgerState = await getLiquidLedgerState(contractModule, api);
  const value = parseDecimalAmountToScaled(
    await rli.question("Enter delegate reward amount: "),
    BigInt(ledgerState.SCALE_FACTOR),
    "delegate reward amount",
  );
  await callTx(api, "recieveDelegateReward", {
    color: encodeTokenType(nativeToken()),
    nonce: randomBytes(32),
    value,
  });
};

const runNightLoop = async (loaded: LoadedContract, api: any, rli: Interface) => {
  while (true) {
    const choice = (await rli.question(CIRCUIT_INTERACTION_CHOICE)).trim();
    try {
      switch (choice) {
        case "1":
          await promptNightStake(api, rli);
          break;
        case "2":
          await promptNightClaim(api, rli);
          break;
        case "3":
          printNightLedger(loaded.module, await displayPublicState(api));
          continue;
        case "4":
          console.dir(formatValue(await displayPrivateState(api)), { depth: null, colors: true });
          continue;
        case "5":
          return;
        default:
          console.log("Invalid option. Select 1 to 5.");
          continue;
      }
      printNightLedger(loaded.module, await displayPublicState(api));
    } catch (error) {
      console.error(error);
    } finally {
      rli.resume();
    }
  }
};

const runLiquidLoop = async (loaded: LoadedContract, api: any, rli: Interface) => {
  while (true) {
    const choice = (await rli.question(LIQUID_STAKING_INTERACTION_CHOICE)).trim();
    try {
      switch (choice) {
        case "1":
          await promptLiquidStake(loaded.module, api, rli);
          break;
        case "2":
          await promptLiquidRedeem(loaded.module, api, rli);
          break;
        case "3":
          await callTx(api, "delegate");
          break;
        case "4":
          await promptLiquidReward(loaded.module, api, rli);
          break;
        case "5":
          await callTx(api, "setTokenColor");
          break;
        case "6":
          printLiquidLedger(loaded.module, await displayPublicState(api));
          continue;
        case "7":
          console.dir(formatValue(await displayPrivateState(api)), { depth: null, colors: true });
          continue;
        case "8":
          return;
        default:
          console.log("Invalid option. Select 1 to 8.");
          continue;
      }
      printLiquidLedger(loaded.module, await displayPublicState(api));
    } catch (error) {
      console.error(error);
    } finally {
      rli.resume();
    }
  }
};

const runContractInteractionLoop = async (
  walletCtx: WalletContext,
  config: Config,
  rli: Interface,
  logger: Logger,
) => {
  const definition = await selectContract(rli);
  if (definition == null) return;

  const loaded = await loadContract(definition);
  const providers = await buildProviders(walletCtx, config, definition);
  const api = await resolveContractApi(loaded, providers, rli, logger);
  if (api == null) return;

  if (definition.kind === "night") {
    printNightLedger(loaded.module, await displayPublicState(api));
    await runNightLoop(loaded, api, rli);
    return;
  }

  printLiquidLedger(loaded.module, await displayPublicState(api));
  await runLiquidLoop(loaded, api, rli);
};

const mapContainerPort = (
  env: StartedDockerComposeEnvironment,
  url: string,
  containerNames: string[],
) => {
  const mappedUrl = new URL(url);
  let container: ReturnType<StartedDockerComposeEnvironment["getContainer"]> | undefined;

  for (const name of containerNames) {
    try {
      container = env.getContainer(name);
      break;
    } catch {}
  }

  if (container === undefined) {
    throw new Error(`Failed to resolve running container from [${containerNames.join(", ")}]`);
  }

  mappedUrl.port = String(container.getFirstMappedPort());
  return mappedUrl.toString().replace(/\/+$/, "");
};

export const run = async (
  config: Config,
  logger: Logger,
  dockerEnv?: DockerComposeEnvironment,
): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  let env: StartedDockerComposeEnvironment | undefined;

  try {
    if (dockerEnv !== undefined) {
      env = await dockerEnv.up();
      config.indexer = mapContainerPort(env, config.indexer, ["indexer", "indexer-1"]);
      config.indexerWS = mapContainerPort(env, config.indexerWS, ["indexer", "indexer-1"]);
      config.node = mapContainerPort(env, config.node, ["node", "node-1"]);
      config.proofServer = mapContainerPort(env, config.proofServer, ["proof-server", "proof-server-1"]);
    }

    console.log(HEADER_BANNER);
    const walletCtx = await buildWallet(config, rli);
    if (walletCtx == null) return;

    while (true) {
      await runContractInteractionLoop(walletCtx, config, rli, logger);
      const again = (await rli.question("Select another contract? [y/N]: ")).trim().toLowerCase();
      if (again !== "y") break;
    }
  } finally {
    rli.close();
    if (env !== undefined) {
      await env.down();
    }
  }
};
