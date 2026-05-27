import { describe, it, expect } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../app';
import { loadConfig } from '../lib/config';
import { createLogger } from '../lib/logger';
import type { StorageAdapter, UploadSignature } from '../adapters/storage/index';

function makeFakeStorageAdapter(override?: Partial<UploadSignature>): StorageAdapter {
  return {
    name: 'fake-storage',
    createSignedUpload(folder) {
      return {
        cloudName: 'test-cloud',
        apiKey: 'test-api-key',
        timestamp: 1700000000,
        signature: 'abc123sig',
        folder: folder ?? 'assignments',
        ...override,
      };
    },
  };
}

function buildTestApp(storageAdapter: StorageAdapter = makeFakeStorageAdapter()): Express {
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
  return createApp({ config, logger, deps: { storageAdapter } });
}

describe('GET /api/uploads/signature', () => {
  it('returns 200 with a signed upload payload', async () => {
    const res = await request(buildTestApp()).get('/api/uploads/signature');
    expect(res.status).toBe(200);
    expect(typeof res.body.signature).toBe('string');
    expect(typeof res.body.timestamp).toBe('number');
    expect(typeof res.body.apiKey).toBe('string');
    expect(typeof res.body.cloudName).toBe('string');
    expect(typeof res.body.folder).toBe('string');
  });

  it('accepts a ?folder query param', async () => {
    const res = await request(buildTestApp()).get('/api/uploads/signature?folder=custom-folder');
    expect(res.status).toBe(200);
    expect(res.body.folder).toBe('custom-folder');
  });

  it('returns all required fields for Cloudinary direct upload', async () => {
    const res = await request(buildTestApp()).get('/api/uploads/signature');
    const { signature, timestamp, apiKey, cloudName, folder } = res.body as Record<string, unknown>;
    expect(signature).toBeTruthy();
    expect(timestamp).toBeGreaterThan(0);
    expect(apiKey).toBeTruthy();
    expect(cloudName).toBeTruthy();
    expect(folder).toBeTruthy();
  });
});
