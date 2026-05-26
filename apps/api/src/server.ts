import { loadConfig } from './lib/config';
import { createLogger } from './lib/logger';
import { createRedisConnection } from './lib/redis';
import { createGenerateQueue } from './lib/queue';
import { createPingService } from './services/ping.service';
import { createApp } from './app';

/**
 * Process entrypoint: load + validate config (fail fast), build the logger,
 * wire up Redis + queue + services, then listen.
 *
 * Dependency order: config → logger → redis → queue → services → app → listen.
 * Graceful shutdown closes the queue connection so in-flight jobs can drain.
 */
const config = loadConfig();
const logger = createLogger(config);

const redisConnection = createRedisConnection(config);
const generateQueue = createGenerateQueue(redisConnection);
const pingService = createPingService({ queue: generateQueue });

const app = createApp({ config, logger, deps: { pingService } });

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'vedaai-api listening');
});

function shutdown(): void {
  server.close(() => {
    generateQueue
      .close()
      .then(() => {
        logger.info('server closed');
        process.exit(0);
      })
      .catch((err: unknown) => {
        logger.error({ err }, 'shutdown error');
        process.exit(1);
      });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
