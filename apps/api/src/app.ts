import express, { type Express } from 'express';
import cors from 'cors';
import type { Logger } from 'pino';
import type { AppConfig } from './lib/config';
import { httpLogger } from './lib/logger';
import { errorHandler, notFoundHandler } from './lib/error';
import type { PingService } from './services/ping.service';
import { createPingRouter } from './routes/ping';

/**
 * Express application factory.
 *
 * Kept separate from `server.ts` (which owns `listen`) so tests can exercise
 * the fully-wired app — middleware order included — without binding a port.
 * `mountTestRoutes` injects probe routes *before* the error handler so the
 * real error pipeline is what gets verified.
 *
 * Feature routes (e.g. ping) are only mounted when their service dependency is
 * provided via `deps`, keeping the base test app lean and the existing
 * /health + error tests untouched.
 */

export interface AppDeps {
  pingService: PingService;
}

export interface CreateAppOptions {
  config: AppConfig;
  logger: Logger;
  deps?: AppDeps;
  mountTestRoutes?: (app: Express) => void;
}

export function createApp({ config, logger, deps, mountTestRoutes }: CreateAppOptions): Express {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === config.webOrigin) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    }),
  );

  app.use(httpLogger(logger));
  app.use(express.json({ limit: '16kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'vedaai-api', uptime: process.uptime() });
  });

  if (deps) {
    app.use('/api', createPingRouter({ pingService: deps.pingService }));
  }

  mountTestRoutes?.(app);

  app.use(notFoundHandler);
  app.use(errorHandler(logger, { isProduction: config.isProduction }));

  return app;
}
