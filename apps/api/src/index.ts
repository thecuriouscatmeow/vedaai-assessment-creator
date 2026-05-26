/**
 * @vedaai/api public surface (for tests/embedding). The process entrypoint is
 * `server.ts`; everything reusable is re-exported here.
 */
export { createApp, type CreateAppOptions } from './app';
export { loadConfig, type AppConfig } from './lib/config';
export { createLogger, httpLogger, type LoggerConfig } from './lib/logger';
export { HttpError, errorHandler, notFoundHandler } from './lib/error';

export type { LlmAdapter, LlmCompletionRequest } from './adapters/llm/index';
export type { DbAdapter } from './adapters/db/index';
export type { CacheAdapter } from './adapters/cache/index';
export type { StorageAdapter, UploadSignature } from './adapters/storage/index';
