import { describe, it, expect, vi } from 'vitest';
import { createPingService } from './ping.service';
import type { GenerateJobData, GenerateQueue } from '../lib/queue';

/**
 * Unit tests for PingService.
 *
 * No live Redis — a fake GenerateQueue is injected so the service logic can
 * be exercised in isolation.
 */

function makeFakeQueue(): GenerateQueue & { calls: GenerateJobData[] } {
  const calls: GenerateJobData[] = [];
  return {
    calls,
    async enqueue(data) {
      calls.push(data);
      return { jobId: 'fake-job-id' };
    },
    async close() {},
  };
}

describe('PingService', () => {
  it('returns a non-empty assignmentId and status "queued"', async () => {
    const queue = makeFakeQueue();
    const service = createPingService({ queue });

    const result = await service.ping();

    expect(result.assignmentId).toBeTruthy();
    expect(result.status).toBe('queued');
  });

  it('calls enqueue exactly once with the generated assignmentId', async () => {
    const queue = makeFakeQueue();
    const spy = vi.spyOn(queue, 'enqueue');
    const service = createPingService({ queue });

    const result = await service.ping();

    expect(spy).toHaveBeenCalledOnce();
    const [jobData] = spy.mock.calls[0] ?? [];
    expect(jobData?.assignmentId).toBe(result.assignmentId);
  });

  it('forwards an optional input payload to the queue', async () => {
    const queue = makeFakeQueue();
    const service = createPingService({ queue });
    const input = {
      dueDate: '2026-06-01',
      questions: [{ type: 'short' as const, count: 2, marks: 5 }],
    };

    await service.ping(input);

    expect(queue.calls[0]?.input).toEqual(input);
  });

  it('produces a different assignmentId on each call', async () => {
    const queue = makeFakeQueue();
    const service = createPingService({ queue });

    const a = await service.ping();
    const b = await service.ping();

    expect(a.assignmentId).not.toBe(b.assignmentId);
  });
});
