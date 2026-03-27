import path from 'node:path';

export interface Config {
  readonly privateStateStoreName: string;
  readonly logDir: string;
  readonly zkConfigPath: string;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
}

export const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');

export const config = {
  privateStateStoreName: 'night-staking-private-state',
  zkConfigPath: path.resolve(currentDir, '..', 'contract-build', 'managed', 'night-staking'),
  logDir: path.resolve(currentDir, '..', 'logs', 'preprod', `${new Date().toISOString()}.log`),
  indexer: 'https://indexer.preview.midnight.network/api/v3/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v3/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  proofServer: 'http://127.0.0.1:6300'
}
