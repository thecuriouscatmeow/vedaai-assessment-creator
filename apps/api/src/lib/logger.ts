import { pino, type Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

/**
 * Structured logging via pino.
 *  - development → pretty, colourised, human-readable.
 *  - production  → newline-delimited JSON for log aggregators.
 * Never use `console.*` (enforced by the `no-console` ESLint rule).
 */

export interface LoggerConfig {
  isProduction: boolean;
  logLevel: string;
}

export function createLogger({ isProduction, logLevel }: LoggerConfig): Logger {
  return pino({
    level: logLevel,
    ...(isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
          },
        }),
  });
}

/**
 * Per-request logging middleware that assigns/propagates a request id
 * (honours an inbound `x-request-id`, echoes it on the response).
 */
export function httpLogger(logger: Logger): RequestHandler {
  return pinoHttp({
    logger,
    genReqId: (req, res) => {
      const inbound = req.headers['x-request-id'];
      const id = (Array.isArray(inbound) ? inbound[0] : inbound) ?? randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
  });
}
