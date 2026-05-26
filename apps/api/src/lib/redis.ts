import type { Redis as IORedis } from 'ioredis';
import { Redis } from 'ioredis';
import type { AppConfig } from './config';

/**
 * Redis connection factory.
 *
 * Returns an ioredis client configured for use with BullMQ. BullMQ requires
 * `maxRetriesPerRequest: null` to disable its per-request retry cap; without
 * this the queue throws on startup.
 *
 * Single concern: connection lifecycle. Queue construction lives in
 * `lib/queue.ts`; callers never import ioredis directly.
 */
export function createRedisConnection(config: AppConfig): IORedis {
  return new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });
}
