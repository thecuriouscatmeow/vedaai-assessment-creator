import { describe, it, expect, vi } from 'vitest';
import pino from 'pino';
import type { AssignmentInput } from '@vedaai/shared';
import type { AssignmentRepository } from '../adapters/db/assignment.repository';
import type { GenerateQueue } from '../lib/queue';
import { createAssignmentService } from './assignment.service';

const logger = pino({ level: 'silent' });

/** Minimal fake that satisfies the AssignmentRepository interface. */
function makeFakeRepo(overrides?: Partial<AssignmentRepository>): AssignmentRepository {
  return {
    async create() {
      return { id: 'fake-assignment-id' };
    },
    async findById() {
      return null;
    },
    async listAll() {
      return [];
    },
    async deleteById() {},
    async setProcessing() {},
    async setDone() {},
    async setFailed() {},
    ...overrides,
  };
}

function makeFakeQueue(overrides?: Partial<GenerateQueue>): GenerateQueue {
  return {
    async enqueue() {
      return { jobId: 'fake-job-id' };
    },
    async close() {},
    ...overrides,
  };
}

const validInput: AssignmentInput = {
  dueDate: '2025-12-01',
  questions: [{ type: 'mcq', count: 5, marks: 2 }],
};

describe('AssignmentService', () => {
  it('creates an assignment and enqueues the generate job', async () => {
    const enqueueSpy = vi.fn().mockResolvedValue({ jobId: 'test-job' });
    const createSpy = vi.fn().mockResolvedValue({ id: 'new-assignment-id' });

    const service = createAssignmentService({
      repo: makeFakeRepo({ create: createSpy }),
      queue: makeFakeQueue({ enqueue: enqueueSpy }),
      logger,
    });

    const result = await service.create(validInput);

    expect(result.assignmentId).toBe('new-assignment-id');
    expect(createSpy).toHaveBeenCalledWith(validInput);
    expect(enqueueSpy).toHaveBeenCalledWith({ assignmentId: 'new-assignment-id', input: validInput });
  });

  it('propagates repository errors', async () => {
    const service = createAssignmentService({
      repo: makeFakeRepo({
        async create() {
          throw new Error('db down');
        },
      }),
      queue: makeFakeQueue(),
      logger,
    });

    await expect(service.create(validInput)).rejects.toThrow('db down');
  });

  it('marks the assignment failed and rethrows when enqueue fails', async () => {
    const setFailedSpy = vi.fn().mockResolvedValue(undefined);
    const service = createAssignmentService({
      repo: makeFakeRepo({ setFailed: setFailedSpy }),
      queue: makeFakeQueue({
        async enqueue() {
          throw new Error('redis down');
        },
      }),
      logger,
    });

    await expect(service.create(validInput)).rejects.toThrow('redis down');
    expect(setFailedSpy).toHaveBeenCalledWith('fake-assignment-id', 'redis down');
  });

  it('returns an assignment by id from the repository', async () => {
    const record = {
      id: 'abc123',
      status: 'queued' as const,
      input: validInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = createAssignmentService({
      repo: makeFakeRepo({
        async findById() {
          return record;
        },
      }),
      queue: makeFakeQueue(),
      logger,
    });

    const result = await service.findById('abc123');
    expect(result?.status).toBe('queued');
  });

  it('lists assignment summaries and deletes by id', async () => {
    const deleteSpy = vi.fn().mockResolvedValue(undefined);
    const service = createAssignmentService({
      repo: makeFakeRepo({
        async listAll() {
          return [
            { id: 'a1', title: 'Quiz', status: 'done', assignedAt: '2026-05-20T10:00:00.000Z', dueDate: '2026-06-21' },
          ];
        },
        deleteById: deleteSpy,
      }),
      queue: makeFakeQueue(),
      logger,
    });

    const list = await service.listAll();
    expect(list).toHaveLength(1);
    expect(list[0]?.title).toBe('Quiz');

    await service.deleteById('a1');
    expect(deleteSpy).toHaveBeenCalledWith('a1');
  });
});
