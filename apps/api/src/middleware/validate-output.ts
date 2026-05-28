import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validateOutput(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);
    res.json = function (data: unknown) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const result = schema.safeParse(data);
        if (!result.success) {
          (req as Request & { log?: { error: (...args: unknown[]) => void } }).log?.error(
            { issues: result.error.issues },
            'output validation failed',
          );
          res.json = originalJson;
          return res.status(500).json({ error: { status: 500, message: 'Internal Server Error' } });
        }
      }
      return originalJson(data);
    } as typeof res.json;
    next();
  };
}
