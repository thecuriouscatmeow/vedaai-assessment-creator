import { describe, it, expect, vi } from 'vitest';
import type { AssignmentRepository } from '../adapters/db/assignment.repository';
import type { GenerateQueue } from '../lib/queue';
import { createAssignmentService } from './assignment.service';

/** Minimal fake that satisfies the AssignmentRepository interface. */
function makeFakeRepo(overrides?: Partial<AssignmentRepository>): AssignmentRepository {
  return {
    async create() {
      return { id: 'fake-assignment-id' };
    },
    async findById() {
      return null;
    },
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

const validInput = {
  dueDate: '2025-12-01',
  questionTypes: ['mcq' as const],
  questions: [{ count: 5, marks: 2 }],
};

describe('AssignmentService', () => {
  it('creates an assignment and enqueues the generate job', async () => {
    const enqueueSpy = vi.fn().mockResolvedValue({ jobId: 'test-job' });
    const createSpy = vi.fn().mockResolvedValue({ id: 'new-assignment-id' });

    const service = createAssignmentService({
      repo: makeFakeRepo({ create: createSpy }),
      queue: makeFakeQueue({ enqueue: enqueueSpy }),
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
    });

    await expect(service.create(validInput)).rejects.toThrow('db down');
  });

  it('propagates queue errors', async () => {
    const service = createAssignmentService({
      repo: makeFakeRepo(),
      queue: makeFakeQueue({
        async enqueue() {
          throw new Error('redis down');
        },
      }),
    });

    await expect(service.create(validInput)).rejects.toThrow('redis down');
  });

  it('returns an assignment by id from the repository', async () => {
    const mockDoc = {
      _id: 'abc123',
      status: 'queued',
      input: validInput,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const service = createAssignmentService({
      repo: makeFakeRepo({ async findById() { return mockDoc as never; } }),
      queue: makeFakeQueue(),
    });

    const result = await service.findById('abc123');
    expect(result?.status).toBe('queued');
  });
});
