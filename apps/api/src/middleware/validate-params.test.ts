import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { pino } from 'pino';
import { requireObjectId } from './validate-params';
import { errorHandler } from '../lib/error';

const silentLogger = pino({ level: 'silent' });

function buildApp() {
  const app = express();
  app.get('/:id', requireObjectId('id'), (req, res) => {
    res.status(200).json({ id: req.params.id });
  });
  app.use(errorHandler(silentLogger, { isProduction: false }));
  return app;
}

describe('requireObjectId', () => {
  it('calls next for a valid ObjectId', async () => {
    const validId = new mongoose.Types.ObjectId().toString();
    const res = await request(buildApp()).get(`/${validId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validId);
  });

  it('returns 400 for a non-ObjectId string', async () => {
    const res = await request(buildApp()).get('/not-an-objectid');
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('returns 400 for a short random string', async () => {
    const res = await request(buildApp()).get('/abc123xyz');
    expect(res.status).toBe(400);
  });
});
