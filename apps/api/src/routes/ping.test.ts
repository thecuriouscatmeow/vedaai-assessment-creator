import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app';
import { loadConfig } from '../lib/config';
import { createLogger } from '../lib/logger';
import { createPingService } from '../services/ping.service';
import type { GenerateQueue } from '../lib/queue';

/**
 * Integration tests for POST /api/ping.
 *
 * A fake GenerateQueue is injected so no Redis connection is required. The
 * full app stack (middleware, router, error handler) is exercised via supertest.
 */

function makeFakeQueue(): GenerateQueue {
  return {
    async enqueue() {
      return { jobId: 'fake-job-id' };
    },
    async close() {},
  };
}

function makeRejectingQueue(): GenerateQueue {
  return {
    async enqueue() {
      throw new Error('queue unavailable');
    },
    async close() {},
  };
}

function buildTestApp(queue: GenerateQueue = makeFakeQueue()): Express {
  const config = loadConfig({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/veda',
    REDIS_URL: 'redis://localhost:6379',
    GEMINI_API_KEY: 'gem-key',
    CLOUDINARY_CLOUD_NAME: 'demo',
    CLOUDINARY_API_KEY: 'cl-key',
    CLOUDINARY_API_SECRET: 'cl-secret',
  });
  const logger = createLogger({ ...config, logLevel: 'silent' });
  const pingService = createPingService({ queue });
  return createApp({ config, logger, deps: { pingService } });
}

describe('POST /api/ping', () => {
  it('responds 202 with assignmentId and status "queued"', async () => {
    const res = await request(buildTestApp()).post('/api/ping');
    expect(res.status).toBe(202);
    expect(typeof res.body.assignmentId).toBe('string');
    expect(res.body.assignmentId.length).toBeGreaterThan(0);
    expect(res.body.status).toBe('queued');
  });

  it('returns a different assignmentId on each call', async () => {
    const app = buildTestApp();
    const a = await request(app).post('/api/ping');
    const b = await request(app).post('/api/ping');
    expect(a.body.assignmentId).not.toBe(b.body.assignmentId);
  });

  it('propagates async errors to the central error handler (500 structured envelope)', async () => {
    const app = buildTestApp(makeRejectingQueue());
    const res = await request(app).post('/api/ping');
    expect(res.status).toBe(500);
    expect(res.body.error.status).toBe(500);
  });
});
