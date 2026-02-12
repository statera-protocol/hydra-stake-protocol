import { createLogger } from '../logger-utils.js';
import { run } from '../index.js';
import { PreviewRemoteConfig } from '../config.js';

const config = new PreviewRemoteConfig();
config.setNetworkId();
const logger = await createLogger(config.logDir);
await run(config, logger);
