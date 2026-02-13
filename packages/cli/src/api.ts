import * as utils from "./utils.js"
import { Contract, ledger, type HydraStakePrivateState, witnesses, Ledger, createHydraStakePrivateState, StakePoolStatus, ShieldedCoinInfo } from '@repo/hydra-stake-protocol';
import {ZswapSecretKeys, DustSecretKey, Signature, SignatureEnabled, Proofish, PreBinding, Intent, UtxoSpend, LedgerParameters, encodeRawTokenType, nativeToken, encodeContractAddress, rawTokenType} from '@midnight-ntwrk/ledger-v7';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v7';
import { deployContract, FinalizedCallTxData, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type FinalizedTxData, type MidnightProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles, generateRandomSeed } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
  type UnshieldedKeystore,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { type Logger } from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import {
  type HydraStakeCircuits,
  type HydraStakeContract,
  HydraStakePrivateStateId,
  type HydraStakeProviders,
  type DeployedHydraStakeContract,
  DeploymentParams,
  DerivedHydraStakeContractState,
} from './common-types.js';
import { type Config, contractConfig } from './config';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { assertIsContractAddress, toHex } from '@midnight-ntwrk/midnight-js-utils';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Buffer } from 'buffer';
import {
  MidnightBech32m,
  ShieldedAddress,
  ShieldedCoinPublicKey,
  ShieldedEncryptionPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { hydraStakePrivateStateId } from "@repo/hydra-stake-api";

let logger: Logger;

// Required for GraphQL subscriptions (wallet sync) to work in Node.js
// @ts-expect-error: It's needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

// Pre-compile the HydraStake contract with ZK circuit assets
const HydraStakeCompiledContract = CompiledContract.make('HydraStake', Contract).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(contractConfig.zkConfigPath),
);

export interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ZswapSecretKeys;
  dustSecretKey: DustSecretKey;
  unshieldedKeystore: UnshieldedKeystore;
}

export const getHydraStakeLedgerState = async (
  providers: HydraStakeProviders,
  contractAddress: ContractAddress,
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract ledger state...');
  const state = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) => (contractState != null ? ledger(contractState.data) : null));
  logger.info(`Ledger state: ${state}`);
  return state;
};

export const displayDerivedLedgerState = async (
  currentState: DerivedHydraStakeContractState,
  logger: Logger,
): Promise<void> => {
  logger.info(`Current admins: ${currentState.admins}`);
  console.log(`Current stake pool amount is:`, currentState.protocolTVL);
  console.log(`Current total value minted is:`, currentState.totalMint);
  console.log(`Current staker:`, currentState.stakings);
  console.log(
    `Current stake pool status:`,
    currentState.stakePoolStatus == StakePoolStatus.available
      ? "AVAILABLE"
      : "DELEGATED",
  );
  console.log(`Current mint token color is:`, currentState.mintTokenColor);
  console.log(`Current valid asset color is:`, currentState.validAssetCoinType);
  console.log(`Current token scaleFactor is:`, currentState.scaleFactor);
  console.log(
    `Current third party contract address is:`,
    currentState.delegationContractAddress,
  );
};

export const getHydraStakePrivateState = async (
  providers: HydraStakeProviders,
  contractAddress: ContractAddress,
): Promise<HydraStakePrivateState> => {
  assertIsContractAddress(contractAddress);
  logger.info('Checking contract ledger state...');
  const state = await providers.privateStateProvider
    .get(HydraStakePrivateStateId)
    .then((privateData) => (privateData != null ? privateData : createHydraStakePrivateState(utils.randomNonceBytes(32))));
  logger.info(`Ledger state: ${state}`);
  return state;
};

export const displayUserPrivateState = async (
    providers: HydraStakeProviders,
    contractAddress: ContractAddress,
    logger: Logger,
  ) => {
    assertIsContractAddress(contractAddress);
    logger.info('Loading user private state...');
    const privateState = await getHydraStakePrivateState(providers, contractAddress);
  
    if (privateState === null)
      logger.info(
        `There is no private state stored at ${hydraStakePrivateStateId}`,
      );
    console.log(`Current collateral reserved is:`, privateState?.stakeMetadata);
    logger.info(`Current secrete-key is: ${privateState?.secretKey}`);
  };

export const HydraStakeContractInstance: HydraStakeContract = new Contract(witnesses);

export const joinContract = async (
  providers: HydraStakeProviders,
  contractAddress: string,
): Promise<DeployedHydraStakeContract> => {
  const HydraStakeContract = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: HydraStakeCompiledContract,
    privateStateId: 'HydraStakePrivateState',
    initialPrivateState: { privateHydraStake: 0 },
  });
  logger.info(`Joined contract at address: ${HydraStakeContract.deployTxData.public.contractAddress}`);
  return HydraStakeContract;
};

export const setMintTokenColor = async (
  deployedContract: DeployedHydraStakeContract
): Promise<
FinalizedCallTxData<HydraStakeContract, "setTokenColor">
> => {
const txData = await deployedContract.callTx.setTokenColor();

logger?.trace({
  transactionAdded: {
    circuit: "setTokenColor",
    txHash: txData.public.txHash,
    blockDetails: {
      blockHash: txData.public.blockHash,
      blockHeight: txData.public.blockHeight,
    },
  },
});

return txData;
}

const coin = (amount: number): ShieldedCoinInfo => {
  return {
    color: encodeRawTokenType(nativeToken().tag),
    nonce: utils.randomNonceBytes(32),
    value: BigInt(amount),
  };
}

  const stCoin = (amount: number, contractAddress: ContractAddress): ShieldedCoinInfo => {
    return {
      color: encodeRawTokenType(
        rawTokenType(
          utils.pad("hydra:htDUST", 32),
          contractAddress
        ),
      ),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

const state = (
  providers: HydraStakeProviders,
  contractAddress: ContractAddress
): Rx.Observable<DerivedHydraStakeContractState> => {
return Rx.combineLatest(
  [
    providers.publicDataProvider
      .contractStateObservable(contractAddress, {
        type: "all",
      })
      .pipe(
        Rx.map((contractState) => ledger(contractState.data)),
        Rx.tap((ledgerState) =>
          logger?.trace({
            ledgerStaeChanged: {
              ledgerState: {
                ...ledgerState,
              },
            },
          }),
        ),
      ),
    Rx.concat(
      Rx.from(providers.privateStateProvider.get(hydraStakePrivateStateId)),
    ),
  ],
  (ledgerState, privateState) => {
    return {
      totalMint: ledgerState.total_stAsset_Minted,
      protocolTVL: ledgerState.protocolTVL,
      mintTokenColor: utils.uint8arraytostring(
        ledgerState.stAssetCoinColor,
      ),
      delegationContractAddress: utils.uint8arraytostring(
        ledgerState.delegationContractAddress,
      ),
      superAdmin: toHex(ledgerState.superAdmin),
      admins: utils.createDerivedAdminArray(ledgerState.admins),
      stakePoolStatus: ledgerState.stakePoolStatus,
      stakings: utils.createArrayFromLedgerMapping(ledgerState.stakings),
      validAssetCoinType: utils.uint8arraytostring(
        ledgerState.validAssetCoinType,
      ),
      scaleFactor: ledgerState.SCALE_FACTOR,
      depositAmount: privateState
        ? privateState?.stakeMetadata.deposit_amount
        : 0n,
      stAssetMinted: privateState
        ? privateState?.stakeMetadata.stAssets_minted
        : 0n,
      redeemable: privateState
        ? privateState?.stakeMetadata.redeemable
        : 0n,
    };
  },
);
}

export const stake = async (
  amount: number,
  deployedContract: DeployedHydraStakeContract,
  providers: HydraStakeProviders
): Promise<FinalizedCallTxData<HydraStakeContract, "stake">> =>  {
  const scaleFactor = await Rx.firstValueFrom(
    state(providers, deployedContract.deployTxData.public.contractAddress).pipe(Rx.map((state) => Number(state.scaleFactor))),
  );
  const txData = await deployedContract.callTx.stake(
    coin(scaleFactor * amount),
  );

  logger?.trace({
    transactionAdded: {
      circuit: "stake",
      txHash: txData.public.txHash,
      blockDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHeight,
      },
    },
  });

  return txData;
}

export const redeem = async (
  amount: number,
  deployedContract: DeployedHydraStakeContract,
  providers: HydraStakeProviders
): Promise<FinalizedCallTxData<HydraStakeContract, "redeem">> => {
  const scaleFactor = await Rx.firstValueFrom(
    state(providers, deployedContract.deployTxData.public.contractAddress).pipe(Rx.map((state) => Number(state.scaleFactor))),
  );
  const txData = await deployedContract.callTx.redeem(
    stCoin(scaleFactor * amount, deployedContract.deployTxData.public.contractAddress),
  );

  logger?.trace({
    transactionAdded: {
      circuit: "redeem",
      txHash: txData.public.txHash,
      blockDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHeight,
      },
    },
  });

  return txData;
}

export const delegate = async (
  deployedContract: DeployedHydraStakeContract
): Promise<
    FinalizedCallTxData<HydraStakeContract, "delegate">
  > => {
    console.log("Retrieved scale factor");
    const txData = await deployedContract.callTx.delegate();

    logger?.trace({
      transactionAdded: {
        circuit: "delegate",
        txHash: txData.public.txHash,
        blockDetails: {
          blockHash: txData.public.blockHash,
          blockHeight: txData.public.blockHeight,
        },
      },
    });

    return txData;
  }

export const deploy = async (
  providers: HydraStakeProviders,
  deploymentParams: DeploymentParams,
): Promise<DeployedHydraStakeContract> => {
  logger.info('Deploying HydraStake contract...');
  const HydraStakeContract = await deployContract(providers, {
    compiledContract: HydraStakeCompiledContract,
    privateStateId: 'HydraStakePrivateState',
    initialPrivateState: createHydraStakePrivateState(utils.randomNonceBytes(32)),
    args: [
      utils.randomNonceBytes(32, logger),
      encodeRawTokenType(nativeToken().raw),
      utils.pad(deploymentParams.mintDomain, 32),
      encodeContractAddress(deploymentParams.deleglationContractAddress),
      deploymentParams.scaleFactor,
    ],
  });
  logger.info(`Deployed contract at address: ${HydraStakeContract.deployTxData.public.contractAddress}`);
  return HydraStakeContract;
};

// export const increment = async (HydraStakeContract: DeployedHydraStakeContract): Promise<FinalizedTxData> => {
//   logger.info('Incrementing...');
//   const finalizedTxData = await HydraStakeContract.callTx.increment();
//   logger.info(`Transaction ${finalizedTxData.public.txId} added in block ${finalizedTxData.public.blockHeight}`);
//   return finalizedTxData.public;
// };

/**
 * Sign all unshielded offers in a transaction's intents, using the correct
 * proof marker for Intent.deserialize. This works around a bug in the wallet
 * SDK where signRecipe hardcodes 'pre-proof', which fails for proven
 * (UnboundTransaction) intents that contain 'proof' data.
 */
const signTransactionIntents = (
  tx: { intents?: Map<number, any> },
  signFn: (payload: Uint8Array) => Signature,
  proofMarker: 'proof' | 'pre-proof',
): void => {
  if (!tx.intents || tx.intents.size === 0) return;

  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;

    // Clone the intent with the correct proof marker.
    // The wallet SDK bug hardcodes 'pre-proof' here, which fails for
    // proven (UnboundTransaction) intents that use 'proof'.
    const cloned = Intent.deserialize<SignatureEnabled, Proofish, PreBinding>(
      'signature',
      proofMarker,
      'pre-binding',
      intent.serialize(),
    );

    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);

    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: UtxoSpend, i: number) => cloned.fallibleUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer = cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }

    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: UtxoSpend, i: number) => cloned.guaranteedUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer = cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }

    tx.intents.set(segment, cloned);
  }
};

/**
 * Create the unified WalletProvider & MidnightProvider for midnight-js.
 * This bridges the wallet-sdk-facade to the midnight-js contract API by
 * implementing balance, sign, finalize, and submit operations.
 */
export const createWalletAndMidnightProvider = async (
  ctx: WalletContext,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  return {
    getCoinPublicKey() {
      return state.shielded.coinPublicKey.toHexString();
    },
    getEncryptionPublicKey() {
      return state.shielded.encryptionPublicKey.toHexString();
    },
    async balanceTx(tx, ttl?) {
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );

      // Work around wallet SDK bug: signRecipe uses hardcoded 'pre-proof'
      // marker when cloning intents, but proven (UnboundTransaction) intents
      // have 'proof' data, causing "Failed to clone intent". We sign manually
      // with the correct proof markers.
      const signFn = (payload: Uint8Array) => ctx.unshieldedKeystore.signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, 'proof');
      if (recipe.balancingTransaction) {
        signTransactionIntents(recipe.balancingTransaction, signFn, 'pre-proof');
      }

      return ctx.wallet.finalizeRecipe(recipe);
    },
    submitTx(tx) {
      return ctx.wallet.submitTransaction(tx) as any;
    },
  };
};

/** Wait until the wallet has fully synced with the network. Returns the synced state. */
export const waitForSync = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.filter((state) => state.isSynced),
    ),
  );

/** Wait until the wallet has a non-zero unshielded balance. Returns the balance. */
export const waitForFunds = (wallet: WalletFacade): Promise<bigint> =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.filter((state) => state.isSynced),
      Rx.map((s) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
      Rx.filter((balance) => balance > 0n),
    ),
  );

const buildShieldedConfig = ({ indexer, indexerWS, node, proofServer }: Config) => ({
  networkId: getNetworkId(),
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWS,
  },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, 'ws')),
});

const buildUnshieldedConfig = ({ indexer, indexerWS }: Config) => ({
  networkId: getNetworkId(),
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWS,
  },
  txHistoryStorage: new InMemoryTransactionHistoryStorage(),
});

const buildDustConfig = ({ indexer, indexerWS, node, proofServer }: Config) => ({
  networkId: getNetworkId(),
  costParameters: {
    additionalFeeOverhead: 300_000_000_000_000n,
    feeBlocksMargin: 5,
  },
  indexerClientConnection: {
    indexerHttpUrl: indexer,
    indexerWsUrl: indexerWS,
  },
  provingServerUrl: new URL(proofServer),
  relayURL: new URL(node.replace(/^http/, 'ws')),
});

/**
 * Derive HD wallet keys for all three roles (Zswap, NightExternal, Dust)
 * from a hex-encoded seed using BIP-44 style derivation at account 0, index 0.
 */
const deriveKeysFromSeed = (seed: string) => {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') {
    throw new Error('Failed to initialize HDWallet from seed');
  }

  const derivationResult = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (derivationResult.type !== 'keysDerived') {
    throw new Error('Failed to derive keys');
  }

  hdWallet.hdWallet.clear();
  return derivationResult.keys;
};

/**
 * Formats a token balance for display (e.g. 1000000000 -> "1,000,000,000").
 */
const formatBalance = (balance: bigint): string => balance.toLocaleString();

/**
 * Runs an async operation with an animated spinner on the console.
 * Shows ⠋⠙⠹... while running, then ✓ on success or ✗ on failure.
 */
export const withStatus = async <T>(message: string, fn: () => Promise<T>): Promise<T> => {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r  ${frames[i++ % frames.length]} ${message}`);
  }, 80);
  try {
    const result = await fn();
    clearInterval(interval);
    process.stdout.write(`\r  ✓ ${message}\n`);
    return result;
  } catch (e) {
    clearInterval(interval);
    process.stdout.write(`\r  ✗ ${message}\n`);
    throw e;
  }
};

/**
 * Register unshielded NIGHT UTXOs for dust generation.
 *
 * On Preprod/Preview, NIGHT tokens generate DUST over time, but only after
 * the UTXOs have been explicitly designated for dust generation via an on-chain
 * transaction. DUST is the non-transferable fee token used by the Midnight network.
 */
const registerForDustGeneration = async (
  wallet: WalletFacade,
  unshieldedKeystore: UnshieldedKeystore,
): Promise<void> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));

  // Check if dust is already available (e.g. from a previous designation)
  if (state.dust.availableCoins.length > 0) {
    const dustBal = state.dust.walletBalance(new Date());
    console.log(`  ✓ Dust tokens already available (${formatBalance(dustBal)} DUST)`);
    return;
  }

  // Only register coins that haven't been designated yet
  const nightUtxos = state.unshielded.availableCoins.filter(
    (coin: any) => coin.meta?.registeredForDustGeneration !== true,
  );
  if (nightUtxos.length === 0) {
    // All coins already registered — just wait for dust to generate
    await withStatus('Waiting for dust tokens to generate', () =>
      Rx.firstValueFrom(
        wallet.state().pipe(
          Rx.throttleTime(5_000),
          Rx.filter((s) => s.isSynced),
          Rx.filter((s) => s.dust.walletBalance(new Date()) > 0n),
        ),
      ),
    );
    return;
  }

  await withStatus(`Registering ${nightUtxos.length} NIGHT UTXO(s) for dust generation`, async () => {
    const recipe = await wallet.registerNightUtxosForDustGeneration(
      nightUtxos,
      unshieldedKeystore.getPublicKey(),
      (payload) => unshieldedKeystore.signData(payload),
    );
    const finalized = await wallet.finalizeRecipe(recipe);
    await wallet.submitTransaction(finalized);
  });

  // Wait for dust to actually generate (balance > 0), not just for coins to appear
  await withStatus('Waiting for dust tokens to generate', () =>
    Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(5_000),
        Rx.filter((s) => s.isSynced),
        Rx.filter((s) => s.dust.walletBalance(new Date()) > 0n),
      ),
    ),
  );
};

/**
 * Prints a formatted wallet summary to the console, showing all three
 * wallet types (Shielded, Unshielded, Dust) with their addresses and balances.
 */
const printWalletSummary = (seed: string, state: any, unshieldedKeystore: UnshieldedKeystore) => {
  const networkId = getNetworkId();
  const unshieldedBalance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;

  // Build the bech32m shielded address from coin + encryption public keys
  const coinPubKey = ShieldedCoinPublicKey.fromHexString(state.shielded.coinPublicKey.toHexString());
  const encPubKey = ShieldedEncryptionPublicKey.fromHexString(state.shielded.encryptionPublicKey.toHexString());
  const shieldedAddress = MidnightBech32m.encode(networkId, new ShieldedAddress(coinPubKey, encPubKey)).toString();

  const DIV = '──────────────────────────────────────────────────────────────';

  console.log(`
${DIV}
  Wallet Overview                            Network: ${networkId}
${DIV}
  Seed: ${seed}
${DIV}

  Shielded (ZSwap)
  └─ Address: ${shieldedAddress}

  Unshielded
  ├─ Address: ${unshieldedKeystore.getBech32Address()}
  └─ Balance: ${formatBalance(unshieldedBalance)} tNight

  Dust
  └─ Address: ${state.dust.dustAddress}

${DIV}`);
};

/**
 * Build (or restore) a wallet from a hex seed, then wait for the wallet
 * to sync and receive funds before returning.
 *
 * Steps:
 *   1. Derive HD keys (Zswap, NightExternal, Dust) from the seed
 *   2. Create the three sub-wallets (Shielded, Unshielded, Dust)
 *   3. Start the WalletFacade and wait for sync
 *   4. Display a wallet summary with all addresses
 *   5. If balance is zero, wait for incoming funds (e.g. from faucet)
 */
export const buildWalletAndWaitForFunds = async (config: Config, seed: string): Promise<WalletContext> => {
  console.log('');

  // Derive HD keys and initialize the three sub-wallets
  const { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore } = await withStatus(
    'Building wallet',
    async () => {
      const keys = deriveKeysFromSeed(seed);
      const shieldedSecretKeys = ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
      const dustSecretKey = DustSecretKey.fromSeed(keys[Roles.Dust]);
      const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], getNetworkId());

      const shieldedWallet = ShieldedWallet(buildShieldedConfig(config)).startWithSecretKeys(shieldedSecretKeys);
      const unshieldedWallet = UnshieldedWallet(buildUnshieldedConfig(config)).startWithPublicKey(
        PublicKey.fromKeyStore(unshieldedKeystore),
      );
      const dustWallet = DustWallet(buildDustConfig(config)).startWithSecretKey(
        dustSecretKey,
        LedgerParameters.initialParameters().dust,
      );

      const wallet = new WalletFacade(shieldedWallet, unshieldedWallet, dustWallet);
      await wallet.start(shieldedSecretKeys, dustSecretKey);

      return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
    },
  );

  // Show seed and unshielded address immediately so user can fund via faucet while syncing
  const networkId = getNetworkId();
  const DIV = '──────────────────────────────────────────────────────────────';
  console.log(`
${DIV}
  Wallet Overview                            Network: ${networkId}
${DIV}
  Seed: ${seed}

  Unshielded Address (send tNight here):
  ${unshieldedKeystore.getBech32Address()}

  Fund your wallet with tNight from the Preprod faucet:
  https://faucet.preprod.midnight.network/
${DIV}
`);

  // Wait for the wallet to sync with the network
  const syncedState = await withStatus('Syncing with network', () => waitForSync(wallet));

  // Display the full wallet summary with all addresses and balances
  printWalletSummary(seed, syncedState, unshieldedKeystore);

  // Check if wallet has funds; if not, wait for incoming tokens
  const balance = syncedState.unshielded.balances[unshieldedToken().raw] ?? 0n;
  if (balance === 0n) {
    const fundedBalance = await withStatus('Waiting for incoming tokens', () => waitForFunds(wallet));
    console.log(`    Balance: ${formatBalance(fundedBalance)} tNight\n`);
  }

  // Register NIGHT UTXOs for dust generation (required for tx fees on Preprod/Preview)
  await registerForDustGeneration(wallet, unshieldedKeystore);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

export const buildFreshWallet = async (config: Config): Promise<WalletContext> =>
  await buildWalletAndWaitForFunds(config, toHex(Buffer.from(generateRandomSeed())));

/**
 * Configure all midnight-js providers needed for contract deployment and interaction.
 * This wires together the wallet, proof server, indexer, and private state storage.
 */
export const configureProviders = async (ctx: WalletContext, config: Config) => {
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider<HydraStakeCircuits>(contractConfig.zkConfigPath);
  return {
    privateStateProvider: levelPrivateStateProvider<typeof HydraStakePrivateStateId>({
      privateStateStoreName: contractConfig.privateStateStoreName,
      walletProvider: walletAndMidnightProvider,
    }),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
};

/**
 * Get the current DUST balance from the wallet state.
 */
export const getDustBalance = async (
  wallet: WalletFacade,
): Promise<{ available: bigint; pending: bigint; availableCoins: number; pendingCoins: number }> => {
  const state = await Rx.firstValueFrom(wallet.state().pipe(Rx.filter((s) => s.isSynced)));
  const available = state.dust.walletBalance(new Date());
  const availableCoins = state.dust.availableCoins.length;
  const pendingCoins = state.dust.pendingCoins.length;
  // Sum pending coin initial values for a rough pending balance
  const pending = state.dust.pendingCoins.reduce((sum, c) => sum + c.initialValue, 0n);
  return { available, pending, availableCoins, pendingCoins };
};

/**
 * Monitor DUST balance with a live-updating display.
 * Prints a status line every 5 seconds showing balance, coins, and status.
 * Resolves when the user presses Enter (via the provided signal).
 */
export const monitorDustBalance = async (wallet: WalletFacade, stopSignal: Promise<void>): Promise<void> => {
  let stopped = false;
  void stopSignal.then(() => {
    stopped = true;
  });

  const sub = wallet
    .state()
    .pipe(
      Rx.throttleTime(5_000),
      Rx.filter((s) => s.isSynced),
    )
    .subscribe((state) => {
      if (stopped) return;

      const now = new Date();
      const available = state.dust.walletBalance(now);
      const availableCoins = state.dust.availableCoins.length;
      const pendingCoins = state.dust.pendingCoins.length;

      const registeredNight = state.unshielded.availableCoins.filter(
        (coin: any) => coin.meta?.registeredForDustGeneration === true,
      ).length;
      const totalNight = state.unshielded.availableCoins.length;

      let status = '';
      if (pendingCoins > 0 && availableCoins === 0) {
        status = '⚠ locked by pending tx';
      } else if (available > 0n) {
        status = '✓ ready to deploy';
      } else if (availableCoins > 0) {
        status = 'accruing...';
      } else if (registeredNight > 0) {
        status = 'waiting for generation...';
      } else {
        status = 'no NIGHT registered';
      }

      const time = now.toLocaleTimeString();
      console.log(
        `  [${time}] DUST: ${formatBalance(available)} (${availableCoins} coins, ${pendingCoins} pending) | NIGHT: ${totalNight} UTXOs, ${registeredNight} registered | ${status}`,
      );
    });

  await stopSignal;
  sub.unsubscribe();
};

export function setLogger(_logger: Logger) {
  logger = _logger;
}
