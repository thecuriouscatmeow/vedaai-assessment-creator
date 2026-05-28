import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateOutput } from './validate-output';

const MessageSchema = z.object({ message: z.string() });

function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/valid', validateOutput(MessageSchema), (_req, res) => {
    res.status(200).json({ message: 'hello' });
  });

  app.get('/invalid', validateOutput(MessageSchema), (_req, res) => {
    res.status(200).json({ wrong: 'shape' });
  });

  app.get('/error-route', validateOutput(MessageSchema), (_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
}

describe('validateOutput', () => {
  it('passes through a valid 2xx response unchanged', async () => {
    const res = await request(buildApp()).get('/valid');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('hello');
  });

  it('converts invalid 2xx response to 500', async () => {
    const res = await request(buildApp()).get('/invalid');
    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });

  it('passes non-2xx responses through without validation', async () => {
    const res = await request(buildApp()).get('/error-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not found');
  });
});
