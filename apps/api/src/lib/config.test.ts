import { describe, it, expect } from 'vitest';
import { loadConfig } from './config';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '4100',
  MONGODB_URI: 'mongodb://localhost:27017/veda',
  REDIS_URL: 'redis://localhost:6379',
  GEMINI_API_KEY: 'gem-key',
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'cl-key',
  CLOUDINARY_API_SECRET: 'cl-secret',
};

describe('loadConfig', () => {
  it('parses a valid environment into typed config', () => {
    const config = loadConfig(validEnv);
    expect(config.nodeEnv).toBe('test');
    expect(config.port).toBe(4100);
    expect(config.isProduction).toBe(false);
    expect(config.cloudinary.cloudName).toBe('demo');
    expect(config.webOrigin).toBe('http://localhost:3000');
  });

  it('accepts a custom WEB_ORIGIN', () => {
    const config = loadConfig({ ...validEnv, WEB_ORIGIN: 'http://localhost:5000' });
    expect(config.webOrigin).toBe('http://localhost:5000');
  });

  it('coerces PORT to a number', () => {
    expect(typeof loadConfig(validEnv).port).toBe('number');
  });

  it('fails fast when a required variable is missing', () => {
    const { MONGODB_URI: _omit, ...incomplete } = validEnv;
    expect(() => loadConfig(incomplete)).toThrow(/MONGODB_URI/);
  });

  it('defaults NODE_ENV to development when unset', () => {
    const { NODE_ENV: _omit, ...noEnv } = validEnv;
    expect(loadConfig(noEnv).nodeEnv).toBe('development');
  });
});
