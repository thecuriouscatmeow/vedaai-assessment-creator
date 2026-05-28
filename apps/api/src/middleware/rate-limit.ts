import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';

export const rateLimitMiddleware: RequestHandler =
  process.env['NODE_ENV'] === 'production'
    ? rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false })
    : (_req, _res, next) => next();
