import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../lib/error';

declare global {
  namespace Express {
    interface Request {
      validBody: unknown;
    }
  }
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new HttpError(400, 'Validation failed', result.error.issues));
      return;
    }
    req.validBody = result.data;
    next();
  };
}
