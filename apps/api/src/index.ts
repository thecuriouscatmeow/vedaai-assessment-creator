/**
 * @vedaai/api public surface (for tests/embedding). The process entrypoint is
 * `server.ts`; everything reusable is re-exported here.
 */
export { createApp, type CreateAppOptions, type AppDeps } from './app';
export { loadConfig, type AppConfig } from './lib/config';
export { createLogger, httpLogger, type LoggerConfig } from './lib/logger';
export { HttpError, errorHandler, notFoundHandler } from './lib/error';
export { createRedisConnection } from './lib/redis';
export { createGenerateQueue, GENERATE_QUEUE, type GenerateJobData, type GenerateQueue } from './lib/queue';
export {
  createSocketServer,
  attachGenerateQueueEvents,
  roomFor,
  type SocketServerOptions,
  type QueueEventsOptions,
} from './lib/socket';
export { createGenerateProcessor, type ProcessorDeps } from './worker';

export type { DbAdapter } from './adapters/db/index';
export type { CacheAdapter } from './adapters/cache/index';
export type { StorageAdapter, UploadSignature } from './adapters/storage/index';
