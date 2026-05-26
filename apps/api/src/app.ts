import express, { type Express } from 'express';
import type { Logger } from 'pino';
import type { AppConfig } from './lib/config';
import { httpLogger } from './lib/logger';
import { errorHandler, notFoundHandler } from './lib/error';

/**
 * Express application factory.
 *
 * Kept separate from `server.ts` (which owns `listen`) so tests can exercise
 * the fully-wired app — middleware order included — without binding a port.
 * `mountTestRoutes` injects probe routes *before* the error handler so the
 * real error pipeline is what gets verified.
 */
export interface CreateAppOptions {
  config: AppConfig;
  logger: Logger;
  mountTestRoutes?: (app: Express) => void;
}

export function createApp({ config, logger, mountTestRoutes }: CreateAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(httpLogger(logger));
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vedaai-api', uptime: process.uptime() });
  });

  mountTestRoutes?.(app);

  app.use(notFoundHandler);
  app.use(errorHandler(logger, { isProduction: config.isProduction }));

  return app;
}
