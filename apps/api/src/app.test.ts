import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from './app';
import { loadConfig } from './lib/config';
import { createLogger } from './lib/logger';

function buildTestApp(mountTestRoutes?: (app: Express) => void) {
  const config = loadConfig({
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/veda',
    REDIS_URL: 'redis://localhost:6379',
    GEMINI_API_KEY: 'gem-key',
    CLOUDINARY_CLOUD_NAME: 'demo',
    CLOUDINARY_API_KEY: 'cl-key',
    CLOUDINARY_API_SECRET: 'cl-secret',
  });
  // Silent logger so the test output stays pristine.
  const logger = createLogger({ ...config, logLevel: 'silent' });
  return createApp({ config, logger, mountTestRoutes });
}

describe('GET /health', () => {
  it('returns 200 with a healthy status payload', async () => {
    const res = await request(buildTestApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('central error handling', () => {
  it('converts a thrown error into a structured JSON response', async () => {
    const app = buildTestApp((a) => {
      a.get('/__boom', () => {
        throw new Error('deliberate failure');
      });
    });
    const res = await request(app).get('/__boom');
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.status).toBe(500);
    expect(typeof res.body.error.message).toBe('string');
  });

  it('returns a structured 404 for unknown routes', async () => {
    const res = await request(buildTestApp()).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.status).toBe(404);
  });
});
