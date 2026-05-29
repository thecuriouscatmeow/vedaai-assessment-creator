import { z } from 'zod';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.slice(0, index).trim();
        let val = trimmed.slice(index + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // Ignore read errors
  }
}

const cwd = process.cwd();
const envPaths = [
  join(cwd, '.env'),
  join(cwd, '.env.local'),
  join(cwd, 'apps/api/.env'),
  join(cwd, 'apps/api/.env.local'),
  join(__dirname, '../../.env'),
  join(__dirname, '../../.env.local'),
];

for (const path of envPaths) {
  loadEnvFile(path);
}

/**
 * Typed, fail-fast configuration.
 *
 * `loadConfig` is a pure function over an env-like object so it is trivially
 * testable and never reads `process.env` implicitly. `server.ts` is the only
 * caller that passes the real `process.env`; a bad/missing var throws at boot
 * with a readable message rather than failing deep in a request.
 */

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.string().min(1).default('info'),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  LLM_PROVIDER: z.enum(['gemini', 'claude']).default('gemini'),
});

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  isProduction: boolean;
  isDevelopment: boolean;
  port: number;
  logLevel: string;
  mongodbUri: string;
  redisUrl: string;
  webOrigin: string;
  llmProvider: 'gemini' | 'claude';
  gemini: { apiKey: string };
  cloudinary: { cloudName: string; apiKey: string; apiSecret: string };
}

export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration — ${missing}`);
  }

  const e = result.data;
  return {
    nodeEnv: e.NODE_ENV,
    isProduction: e.NODE_ENV === 'production',
    isDevelopment: e.NODE_ENV === 'development',
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    mongodbUri: e.MONGODB_URI,
    redisUrl: e.REDIS_URL,
    webOrigin: e.WEB_ORIGIN,
    llmProvider: e.LLM_PROVIDER,
    gemini: { apiKey: e.GEMINI_API_KEY },
    cloudinary: {
      cloudName: e.CLOUDINARY_CLOUD_NAME,
      apiKey: e.CLOUDINARY_API_KEY,
      apiSecret: e.CLOUDINARY_API_SECRET,
    },
  };
}
