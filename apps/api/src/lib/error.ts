import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';

/**
 * Central error handling. Every failure leaves the API as the same structured
 * JSON envelope: `{ error: { status, message, requestId } }`. 5xx messages are
 * masked in production so internals never leak to clients.
 */

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Thrown by the repository when an entity is missing. Routes translate it to a
 * 404 via `instanceof` — no brittle message string-matching.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { status: 404, message: 'Not Found', requestId: req.id } });
};

export interface ErrorHandlerOptions {
  isProduction: boolean;
}

export function errorHandler(logger: Logger, { isProduction }: ErrorHandlerOptions): ErrorRequestHandler {
  // Express identifies error middleware by its four-arg signature.
  return (err, req, res, _next) => {
    const status = err instanceof HttpError ? err.status : 500;
    (req.log ?? logger).error({ err, requestId: req.id }, 'request failed');

    const message =
      status < 500 ? (err as Error).message : isProduction ? 'Internal Server Error' : (err as Error).message;

    res.status(status).json({ error: { status, message, requestId: req.id } });
  };
}
