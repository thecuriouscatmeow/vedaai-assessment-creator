import { loadConfig } from './lib/config';
import { createLogger } from './lib/logger';
import { createApp } from './app';

/**
 * Process entrypoint: load + validate config (fail fast), build the logger and
 * app, then listen. Feature wiring (DB/Redis/queue adapters) lands in Phase 4.
 */
const config = loadConfig();
const logger = createLogger(config);
const app = createApp({ config, logger });

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'vedaai-api listening');
});
