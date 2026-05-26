import { Queue } from 'bullmq';
import type { Redis as IORedis } from 'ioredis';
import type { AssignmentInput } from '@vedaai/shared';

/**
 * Provider-agnostic generate-queue adapter.
 *
 * Consumers depend only on the `GenerateQueue` interface — BullMQ never leaks
 * past this boundary. A test can swap in a fake; a future migration to a
 * different queue provider touches only this file and `lib/redis.ts`.
 */

export const GENERATE_QUEUE = 'generate' as const;

/** Data attached to each generation job. */
export interface GenerateJobData {
  assignmentId: string;
  input?: AssignmentInput;
}

/** Public interface that the service layer depends on. */
export interface GenerateQueue {
  enqueue(data: GenerateJobData): Promise<{ jobId: string }>;
  close(): Promise<void>;
}

/**
 * Creates a {@link GenerateQueue} backed by a BullMQ `Queue`.
 *
 * @param connection - A pre-configured ioredis client (BullMQ requirement:
 *   `maxRetriesPerRequest: null` must be set on the connection).
 */
export function createGenerateQueue(connection: IORedis): GenerateQueue {
  const bullQueue = new Queue<GenerateJobData>(GENERATE_QUEUE, { connection });

  return {
    async enqueue(data) {
      const job = await bullQueue.add(GENERATE_QUEUE, data);
      if (!job.id) {
        throw new Error('BullMQ did not return a job id');
      }
      return { jobId: job.id };
    },

    async close() {
      await bullQueue.close();
    },
  };
}
