import { type WalletContext } from './api.js';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface, type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type StartedDockerComposeEnvironment, type DockerComposeEnvironment } from 'testcontainers';
import { type HydraStakeProviders, type DeployedHydraStakeContract, contractAddress } from './common-types.js';
import { type Config, StandaloneConfig } from './config';
import * as api from './api.js';
import { nativeToken } from '@midnight-ntwrk/ledger-v7';

let logger: Logger;

/**
 * This seed gives access to tokens minted in the genesis block of a local development node.
 * Only used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED = '0000000000000000000000000000000000000000000000000000000000000001';

// ─── Display Helpers ────────────────────────────────────────────────────────

const BANNER = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              Midnight Counter Example                        ║
║              ─────────────────────                           ║
║              A privacy-preserving smart contract demo        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

const DIVIDER = '──────────────────────────────────────────────────────────────';

// ─── Menu Helpers ──────────────────────────────────────────────────────────

const WALLET_MENU = `
${DIVIDER}
  Wallet Setup
${DIVIDER}
  [1] Create a new wallet
  [2] Restore wallet from seed
  [3] Exit
${'─'.repeat(62)}
> `;

/** Build the contract actions menu, showing current DUST balance in the header. */
const contractMenu = (dustBalance: string) => `
${DIVIDER}
  Contract Actions${dustBalance ? `                    DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1] Deploy a new hydra stake contract
  [2] Join an existing hydra stake contract
  [3] Monitor DUST balance
  [4] Exit
${'─'.repeat(62)}
> `;

/** Build the hydra stke actions menu, showing current DUST balance in the header. */
const counterMenu = (dustBalance: string) => `
${DIVIDER}
  HYDRASTAKE Actions${dustBalance ? `                     DUST: ${dustBalance}` : ''}
${DIVIDER}
  [1]. Set coin color
  [2]. Stake Asset
  [3]. Redeem
  [4]. Display user private state
  [5]. Display derived ledger state
  [6]. Delegating token to third party
  [7]. Exit
${'─'.repeat(62)}
> `;

// ─── Wallet Setup ───────────────────────────────────────────────────────────

/** Prompt the user for a seed phrase and restore a wallet from it. */
const buildWalletFromSeed = async (config: Config, rli: Interface): Promise<WalletContext> => {
  const seed = await rli.question('Enter your wallet seed: ');
  return await api.buildWalletAndWaitForFunds(config, seed);
};

/**
 * Wallet creation flow.
 * - Standalone configs skip the menu and use the genesis seed automatically.
 * - All other configs present a menu to create or restore a wallet.
 */
const buildWallet = async (config: Config, rli: Interface): Promise<WalletContext | null> => {
  // Standalone mode: use the pre-funded genesis wallet
  if (config instanceof StandaloneConfig) {
    return await api.buildWalletAndWaitForFunds(config, GENESIS_MINT_WALLET_SEED);
  }

  while (true) {
    const choice = await rli.question(WALLET_MENU);
    switch (choice.trim()) {
      case '1':
        return await api.buildFreshWallet(config);
      case '2':
        return await buildWalletFromSeed(config, rli);
      case '3':
        return null;
      default:
        logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Contract Interaction ───────────────────────────────────────────────────

/** Format dust balance for menu headers. */
const getDustLabel = async (wallet: api.WalletContext['wallet']): Promise<string> => {
  try {
    const dust = await api.getDustBalance(wallet);
    return dust.available.toLocaleString();
  } catch {
    return '';
  }
};

/** Prompt for a contract address and join an existing deployed contract. */
const joinContract = async (providers: HydraStakeProviders, rli: Interface): Promise<DeployedHydraStakeContract> => {
  const contractAddress = await rli.question('Enter the contract address (hex): ');
  return await api.joinContract(providers, contractAddress);
};

/**
 * Start the DUST monitor. Shows a live-updating balance display
 * that runs until the user presses Enter.
 */
const startDustMonitor = async (wallet: api.WalletContext['wallet'], rli: Interface): Promise<void> => {
  console.log('');
  // Use readline question to wait for Enter — the monitor will render above this line
  const stopPromise = rli.question('  Press Enter to return to menu...\n').then(() => {});
  await api.monitorDustBalance(wallet, stopPromise);
  console.log('');
};

/**
 * Deploy or join flow. Returns the contract handle, or null if the user exits.
 * Errors during deploy/join are caught and displayed — the user stays in the menu.
 */
const deploymentParams = {
  validAssetContractAddress: nativeToken().raw,
  mintDomain: "hydra:htDUST",
  deleglationContractAddress: contractAddress,
  scaleFactor: 1_000_000n
}

const deployOrJoin = async (
  providers: HydraStakeProviders,
  walletCtx: api.WalletContext,
  rli: Interface,
): Promise<DeployedHydraStakeContract | null> => {
  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(contractMenu(dustLabel));
    switch (choice.trim()) {
      case '1':
        try {
          const contract = await api.withStatus('Deploying counter contract', () =>
            api.deploy(providers, deploymentParams),
          );

          console.log(`  Contract deployed at: ${contract.deployTxData.public.contractAddress}\n`);
          return contract;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`\n  ✗ Deploy failed: ${msg}`);
          // Log the full cause chain to help debug WASM/ledger errors
          if (e instanceof Error && e.cause) {
            let cause: unknown = e.cause;
            let depth = 0;
            while (cause && depth < 5) {
              const causeMsg =
                cause instanceof Error
                  ? `${cause.message}\n      ${cause.stack?.split('\n').slice(1, 3).join('\n      ') ?? ''}`
                  : String(cause);
              console.log(`    cause: ${causeMsg}`);
              cause = cause instanceof Error ? cause.cause : undefined;
              depth++;
            }
          }
          if (msg.toLowerCase().includes('dust') || msg.toLowerCase().includes('no dust')) {
            console.log('    Insufficient DUST for transaction fees. Use option [3] to monitor your balance.');
          }
          console.log('');
        }
        break;
      case '2':
        try {
          return await joinContract(providers, rli);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log(`  ✗ Failed to join contract: ${msg}\n`);
        }
        break;
      case '3':
        await startDustMonitor(walletCtx.wallet, rli);
        break;
      case '4':
        return null;
      default:
        console.log(`  Invalid choice: ${choice}`);
    }
  }
};

/**
 * Main interaction loop. Once a contract is deployed/joined, the user
 * can increment the counter or query its current value.
 */
const mainLoop = async (providers: HydraStakeProviders, walletCtx: api.WalletContext, rli: Interface): Promise<void> => {
  const hydraStakeContract = await deployOrJoin(providers, walletCtx, rli);
  if (hydraStakeContract === null) {
    return;
  }

  while (true) {
    const dustLabel = await getDustLabel(walletCtx.wallet);
    const choice = await rli.question(counterMenu(dustLabel));
    switch (choice.trim()) {
        case "1": {
                    await displayLedgerState(
                      providers,
                      hydraDeployedApi.allReadyDeployedContract,
                      logger,
                    );
                    break;
                  }
                  case "2": {
                    await displayDerivedLedgerState(
                      currentState as DerivedHydraStakeContractState,
                      logger,
                    );
                    break;
                  }
                  case "3": {
                    await displayUserPrivateState(providers, logger);
                    break;
                  }
                  case "4": {
                    // New option to manually check wallet state
                    await displayComprehensiveWalletState(wallet, currentState, logger);
                    break;
                  }
                  case "5": {
                    // New option to manually check wallet state
                    logger.info("Setting mint token color...");
                    await hydraDeployedApi.setMintTokenColor();
                    logger.info(
                      "Waiting for wallet to sync after setting mint token color...",
                    );
                    await waitForWalletSyncAfterOperation(wallet, logger);
                    await displayComprehensiveWalletState(wallet, currentState, logger);
                    break;
                  }
          
                  case "6": {
                    // New option to manually check wallet state
                    logger.info("Staking token to pool...");
                    await hydraDeployedApi?.stake(
                      Number(await rli.question("Enter stake amount: ")),
                    );
                    logger.info("Waiting for wallet to sync after staking...");
                    await waitForWalletSyncAfterOperation(wallet, logger);
                    await displayComprehensiveWalletState(wallet, currentState, logger);
                    break;
                  }
          
                  case "7": {
                    // New option to manually check wallet state
                    logger.info("Redeeming token from pool...");
                    await hydraDeployedApi?.redeem(
                      Number(await rli.question("Enter stake amount to redeem: ")),
                    );
                    logger.info("Waiting for wallet to sync after redeeming...");
                    await waitForWalletSyncAfterOperation(wallet, logger);
                    await displayComprehensiveWalletState(wallet, currentState, logger);
                    break;
                  }
          
                  case "8": {
                    // New option to manually check wallet state
                    logger.info("Delegating token to third party...");
                    await hydraDeployedApi?.delegate();
                    logger.info("Waiting for wallet to sync after redeeming...");
                    await waitForWalletSyncAfterOperation(wallet, logger);
                    await displayComprehensiveWalletState(wallet, currentState, logger);
                    break;
                  }
          
                  case "9": {
                    logger.info("Exiting.......");
                    return;
                  }
                  default:
                    logger.error(`Invalid choice: ${choice}`);
    }
  }
};

// ─── Docker Port Mapping ────────────────────────────────────────────────────

/** Map a container's first exposed port into the config URL. */
const mapContainerPort = (env: StartedDockerComposeEnvironment, url: string, containerName: string) => {
  const mappedUrl = new URL(url);
  const container = env.getContainer(containerName);
  mappedUrl.port = String(container.getFirstMappedPort());
  return mappedUrl.toString().replace(/\/+$/, '');
};

// ─── Entry Point ────────────────────────────────────────────────────────────

/**
 * Main entry point for the CLI.
 *
 * Flow:
 *   1. (Optional) Start Docker containers for proof server / node / indexer
 *   2. Build or restore a wallet and wait for it to be funded
 *   3. Configure midnight-js providers (proof server, indexer, wallet, private state)
 *   4. Enter the contract deploy/join and counter interaction loop
 *   5. Clean up: close wallet, readline, and docker environment
 */
export const run = async (config: Config, _logger: Logger, dockerEnv?: DockerComposeEnvironment): Promise<void> => {
  logger = _logger;
  api.setLogger(_logger);

  // Print the title banner
  console.log(BANNER);

  const rli = createInterface({ input, output, terminal: true });
  let env: StartedDockerComposeEnvironment | undefined;

  try {
    // Step 1: Start Docker environment if provided (e.g. local proof server)
    if (dockerEnv !== undefined) {
      env = await dockerEnv.up();

      // In standalone mode, remap ports to the dynamically assigned container ports
      if (config instanceof StandaloneConfig) {
        config.indexer = mapContainerPort(env, config.indexer, 'counter-indexer');
        config.indexerWS = mapContainerPort(env, config.indexerWS, 'counter-indexer');
        config.node = mapContainerPort(env, config.node, 'counter-node');
        config.proofServer = mapContainerPort(env, config.proofServer, 'counter-proof-server');
      }
    }

    // Step 2: Build wallet (create new or restore from seed)
    const walletCtx = await buildWallet(config, rli);
    if (walletCtx === null) {
      return;
    }

    try {
      // Step 3: Configure midnight-js providers
      const providers = await api.withStatus('Configuring providers', () => api.configureProviders(walletCtx, config));
      console.log('');

      // Step 4: Enter the contract interaction loop
      await mainLoop(providers, walletCtx, rli);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(`Error: ${e.message}`);
        logger.debug(`${e.stack}`);
      } else {
        throw e;
      }
    } finally {
      // Step 5a: Stop the wallet
      try {
        await walletCtx.wallet.stop();
      } catch (e) {
        logger.error(`Error stopping wallet: ${e}`);
      }
    }
  } finally {
    // Step 5b: Close readline and Docker environment
    rli.close();
    rli.removeAllListeners();

    if (env !== undefined) {
      try {
        await env.down();
      } catch (e) {
        logger.error(`Error shutting down docker environment: ${e}`);
      }
    }

    logger.info('Goodbye.');
  }
};
