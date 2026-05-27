import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { QuestionPaperSchema } from '@vedaai/shared';
import { createGenerateProcessor } from './worker';
import { createAssignmentRepository } from './adapters/db/assignment.repository';
import type { LlmAdapter } from './adapters/llm/index';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 30_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]?.deleteMany({});
  }
});

const validPaperJson = JSON.stringify({
  title: 'Test Paper',
  subject: 'Science',
  totalMarks: 10,
  studentInfo: {},
  sections: [{ title: 'Section A', questions: [{ text: 'Q1?', difficulty: 'easy', marks: 10 }] }],
});

function makeMockLlm(response = validPaperJson): LlmAdapter {
  return {
    name: 'mock',
    complete: vi.fn().mockResolvedValue(response),
  };
}

describe('createGenerateProcessor (real generation path)', () => {
  it('resolves a schema-valid QuestionPaper for a queued assignment', async () => {
    const repo = createAssignmentRepository();
    const { id: assignmentId } = await repo.create({
      dueDate: '2025-12-01',
      questionTypes: ['mcq'],
      questions: [{ count: 5, marks: 2 }],
    });

    const llm = makeMockLlm();
    const processor = createGenerateProcessor({ repo, llm });

    const result = await processor({ data: { assignmentId } });

    expect(() => QuestionPaperSchema.parse(result)).not.toThrow();
    expect(result.title).toBe('Test Paper');
  });

  it('persists assignment as done with the paper after success', async () => {
    const { AssignmentModel } = await import('./models/assignment');
    const repo = createAssignmentRepository();
    const { id: assignmentId } = await repo.create({
      dueDate: '2025-12-01',
      questionTypes: ['short'],
      questions: [{ count: 3, marks: 5 }],
    });

    const llm = makeMockLlm();
    await createGenerateProcessor({ repo, llm })({ data: { assignmentId } });

    const doc = await AssignmentModel.findById(assignmentId);
    expect(doc?.status).toBe('done');
    expect(doc?.paper?.title).toBe('Test Paper');
  });

  it('persists assignment as failed when LLM throws', async () => {
    const { AssignmentModel } = await import('./models/assignment');
    const repo = createAssignmentRepository();
    const { id: assignmentId } = await repo.create({
      dueDate: '2025-12-01',
      questionTypes: ['mcq'],
      questions: [{ count: 1, marks: 1 }],
    });

    const failingLlm: LlmAdapter = {
      name: 'mock',
      complete: vi.fn().mockRejectedValue(new Error('Gemini API error')),
    };

    await expect(
      createGenerateProcessor({ repo, llm: failingLlm })({ data: { assignmentId } }),
    ).rejects.toThrow('Gemini API error');

    const doc = await AssignmentModel.findById(assignmentId);
    expect(doc?.status).toBe('failed');
    expect(doc?.error).toContain('Gemini API error');
  });

  it('persists assignment as failed when output is unparseable after repair', async () => {
    const { AssignmentModel } = await import('./models/assignment');
    const repo = createAssignmentRepository();
    const { id: assignmentId } = await repo.create({
      dueDate: '2025-12-01',
      questionTypes: ['mcq'],
      questions: [{ count: 1, marks: 1 }],
    });

    const badLlm: LlmAdapter = {
      name: 'mock',
      // Always returns invalid JSON (both initial and repair-retry)
      complete: vi.fn().mockResolvedValue('not valid json at all'),
    };

    await expect(
      createGenerateProcessor({ repo, llm: badLlm })({ data: { assignmentId } }),
    ).rejects.toThrow();

    const doc = await AssignmentModel.findById(assignmentId);
    expect(doc?.status).toBe('failed');
  });

  it('marks assignment as processing before calling the LLM', async () => {
    const { AssignmentModel } = await import('./models/assignment');
    const repo = createAssignmentRepository();
    const { id: assignmentId } = await repo.create({
      dueDate: '2025-12-01',
      questionTypes: ['mcq'],
      questions: [{ count: 1, marks: 1 }],
    });

    let statusDuringLlmCall: string | undefined;
    const observingLlm: LlmAdapter = {
      name: 'mock',
      async complete() {
        const doc = await AssignmentModel.findById(assignmentId);
        statusDuringLlmCall = doc?.status;
        return validPaperJson;
      },
    };

    await createGenerateProcessor({ repo, llm: observingLlm })({ data: { assignmentId } });
    expect(statusDuringLlmCall).toBe('processing');
  });
});
