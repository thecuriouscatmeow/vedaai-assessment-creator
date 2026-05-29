import { createServer } from 'node:http';
import { loadConfig } from './lib/config';
import { createLogger } from './lib/logger';
import { createMongooseAdapter } from './adapters/db/mongoose.adapter';
import { createRedisConnection } from './lib/redis';
import { createGenerateQueue } from './lib/queue';
import { createSocketServer, attachGenerateQueueEvents } from './lib/socket';
import { createAssignmentRepository } from './adapters/db/assignment.repository';
import { createAssignmentService } from './services/assignment.service';
import { createCloudinaryAdapter } from './adapters/storage/cloudinary.adapter';
import { createApp } from './app';

/**
 * Process entrypoint.
 *
 * Dependency order:
 *   config → logger → redis → queue → services → app
 *   → http server → Socket.IO → QueueEvents → listen
 *
 * The explicit http server is required so Socket.IO can share the same port as
 * Express. QueueEvents runs in THIS process (not the worker) so that socket
 * emission stays in the process that holds the client connections.
 *
 * Graceful shutdown closes Socket.IO, QueueEvents, the queue, and the http
 * server in the correct order.
 */
const config = loadConfig();
const logger = createLogger(config);

const dbAdapter = createMongooseAdapter(config.mongodbUri, logger);

const redisConnection = createRedisConnection(config);
// QueueEvents needs its own ioredis connection (BullMQ requirement)
const queueEventsConnection = createRedisConnection(config);

const generateQueue = createGenerateQueue(redisConnection);

const assignmentRepo = createAssignmentRepository();
const assignmentService = createAssignmentService({
  repo: assignmentRepo,
  queue: generateQueue,
  logger,
});
const storageAdapter = createCloudinaryAdapter(config);

const app = createApp({ config, logger, deps: { assignmentService, storageAdapter } });

const httpServer = createServer(app);

const io = createSocketServer(httpServer, {
  logger,
  corsOrigin: config.webOrigin,
});

const queueEvents = attachGenerateQueueEvents(io, {
  connection: queueEventsConnection,
  logger,
});

// Start listening immediately so the Railway healthcheck passes, then connect
// to MongoDB with retries. DB-dependent routes return 503 until connected.
httpServer.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'vedaai-api listening');
});

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await dbAdapter.connect();
  } catch (err: unknown) {
    logger.error({ err, attempt }, 'Failed to connect to database — retrying in 5s');
    setTimeout(() => void connectWithRetry(attempt + 1), 5_000);
  }
}

void connectWithRetry();

function shutdown(): void {
  logger.info('shutdown: signal received');

  new Promise<void>((resolve, reject) => {
    io.close((err) => {
      if (err) reject(err);
      else {
        logger.info('shutdown: socket.io closed');
        resolve();
      }
    });
  })
    .then(() => queueEvents.close())
    .then(() => generateQueue.close())
    .then(() => redisConnection.quit())
    .then(() => queueEventsConnection.quit())
    .then(() => dbAdapter.disconnect())
    .then(
      () =>
        new Promise<void>((resolve, reject) => {
          httpServer.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        }),
    )
    .then(() => {
      logger.info('shutdown: complete');
      process.exit(0);
    })
    .catch((err: unknown) => {
      logger.error({ err }, 'shutdown: error');
      process.exit(1);
    });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
