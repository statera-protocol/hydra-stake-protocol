import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import path from 'node:path';

export interface Config {
  readonly logDir: string;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const contractConfig = {
  nightStaking: {
    distEntryPath: path.resolve(
      currentDir,
      "..",
      "..",
      "contracts",
      "hydra-night-staking",
      "dist",
      "index.js",
    ),
    zkConfigPath: path.resolve(
      currentDir,
      "..",
      "..",
      "contracts",
      "hydra-night-staking",
      "dist",
      "managed",
      "night-staking",
    ),
    privateStateStoreName: "night-staking-private-state",
  },
  liquidStaking: {
    distEntryPath: path.resolve(
      currentDir,
      "..",
      "..",
      "contracts",
      "hydra-liquid-staking",
      "dist",
      "index.js",
    ),
    zkConfigPath: path.resolve(
      currentDir,
      "..",
      "..",
      "contracts",
      "hydra-liquid-staking",
      "dist",
      "managed",
      "hydra-stake-protocol",
    ),
    privateStateStoreName: "hydra-liquid-staking-private-state",
  },
};

export class PreviewConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod-local', `${new Date().toISOString()}.log`);
  indexer = 'https://indexer.preview.midnight.network/api/v3/graphql';
  indexerWS = 'wss://indexer.preview.midnight.network/api/v3/graphql/ws';
  node = 'https://rpc.preview.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId('preview');
  }
}

export class StandaloneConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'standalone', `${new Date().toISOString()}.log`);
  indexer = 'http://127.0.0.1:8088/api/v3/graphql';
  indexerWS = 'ws://127.0.0.1:8088/api/v3/graphql/ws';
  node = 'ws://127.0.0.1:9944';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId('undeployed');
  }
}

export class PreProdRemoteConfig implements Config {
  logDir = path.resolve(currentDir, '..', 'logs', 'preprod', `${new Date().toISOString()}.log`);
  indexer = 'https://indexer.preprod.midnight.network/api/v3/graphql';
  indexerWS = 'wss://indexer.preprod.midnight.network/api/v3/graphql/ws';
  node = 'https://rpc.preprod.midnight.network';
  proofServer = 'http://127.0.0.1:6300';
  constructor() {
    setNetworkId('preprod');
  }
}
