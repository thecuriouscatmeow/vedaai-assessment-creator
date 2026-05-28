import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { pino } from 'pino';
import { validateBody } from './validate-body';
import { errorHandler } from '../lib/error';

const TestSchema = z.object({ name: z.string(), age: z.number() });
const silentLogger = pino({ level: 'silent' });

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/test', validateBody(TestSchema), (req, res) => {
    res.status(200).json({ ok: true, body: req.validBody });
  });
  app.use(errorHandler(silentLogger, { isProduction: false }));
  return app;
}

describe('validateBody', () => {
  it('passes valid body and sets req.validBody', async () => {
    const res = await request(buildApp()).post('/test').send({ name: 'Alice', age: 30 });
    expect(res.status).toBe(200);
    expect(res.body.body).toMatchObject({ name: 'Alice', age: 30 });
  });

  it('rejects missing required field with 400 and issues array', async () => {
    const res = await request(buildApp()).post('/test').send({ age: 30 });
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
    expect(Array.isArray(res.body.error.issues)).toBe(true);
    expect(res.body.error.issues.length).toBeGreaterThan(0);
  });

  it('rejects wrong field type with 400', async () => {
    const res = await request(buildApp()).post('/test').send({ name: 'Alice', age: 'not-a-number' });
    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('rejects empty body with 400', async () => {
    const res = await request(buildApp()).post('/test').send({});
    expect(res.status).toBe(400);
  });
});
