import { randomUUID } from 'node:crypto';
import type { AssignmentInput, AssignmentQueued } from '@vedaai/shared';
import type { GenerateQueue } from '../lib/queue';

/**
 * PingService — business layer for the walking-skeleton ping endpoint.
 *
 * Generates a unique assignment id, enqueues a generation job, and returns
 * the id together with an initial status. No Express or BullMQ types leak
 * through: the service depends only on the `GenerateQueue` interface so the
 * queue provider can be swapped or faked in tests.
 */

export interface PingService {
  ping(input?: AssignmentInput): Promise<AssignmentQueued>;
}

export function createPingService(deps: { queue: GenerateQueue }): PingService {
  const { queue } = deps;

  return {
    /**
     * Enqueues a generation job and returns the new assignment id.
     *
     * @param input - Optional teacher form payload forwarded to the worker.
     */
    async ping(input?: AssignmentInput): Promise<AssignmentQueued> {
      const assignmentId = randomUUID();
      await queue.enqueue({ assignmentId, input });
      return { assignmentId, status: 'queued' };
    },
  };
}
