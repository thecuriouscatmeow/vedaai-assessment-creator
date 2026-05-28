import mongoose from 'mongoose';
import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/error';

export function requireObjectId(paramName: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
      next(new HttpError(400, `Invalid ${paramName}: must be a valid ObjectId`));
      return;
    }
    next();
  };
}
