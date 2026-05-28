import { filterXSS } from 'xss';
import type { Request, Response, NextFunction } from 'express';

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return filterXSS(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, sanitizeValue(v)]),
    );
  }
  return value;
}

export function sanitizeBody() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = sanitizeValue(req.body) as typeof req.body;
    next();
  };
}
