import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { QuestionPaperSchema } from '@vedaai/shared';
import { createGenerateProcessor } from './worker';
import { createAssignmentRepository } from './adapters/db/assignment.repository';
import { SCHOOL_NAME, SCHOOL_ADDRESS } from './lib/school';
import type { GenerationPipeline } from './domain/pipeline';

let mongod: MongoMemoryServer;
beforeAll(async () => { mongod = await MongoMemoryServer.create(); await mongoose.connect(mongod.getUri()); }, 30_000);
afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });
beforeEach(async () => { for (const k in mongoose.connection.collections) await mongoose.connection.collections[k]?.deleteMany({}); });

const validPaper = {
  title: 'Test Paper', schoolName: SCHOOL_NAME, schoolAddress: SCHOOL_ADDRESS,
  subject: 'Science', className: 'Class 5', totalMarks: 10, studentInfo: {},
  sections: [{ title: 'Section A', questions: [{ text: 'Q1?', difficulty: 'easy', marks: 10 }] }],
};
const okPipeline = (): GenerationPipeline => ({ invoke: vi.fn().mockResolvedValue(validPaper) });

describe('createGenerateProcessor', () => {
  it('resolves a schema-valid QuestionPaper', async () => {
    const repo = createAssignmentRepository();
    const { id } = await repo.create({ dueDate: '2025-12-01', questions: [{ type: 'mcq', count: 5, marks: 2 }] });
    const result = await createGenerateProcessor({ repo, pipeline: okPipeline() })({ data: { assignmentId: id } });
    expect(() => QuestionPaperSchema.parse(result)).not.toThrow();
    expect(result.title).toBe('Test Paper');
  });

  it('persists done with the paper', async () => {
    const repo = createAssignmentRepository();
    const { id } = await repo.create({ dueDate: '2025-12-01', questions: [{ type: 'short', count: 3, marks: 5 }] });
    await createGenerateProcessor({ repo, pipeline: okPipeline() })({ data: { assignmentId: id } });
    const record = await repo.findById(id);
    expect(record?.status).toBe('done');
    expect(record?.paper?.title).toBe('Test Paper');
  });

  it('persists failed when the pipeline throws', async () => {
    const { AssignmentModel } = await import('./models/assignment');
    const repo = createAssignmentRepository();
    const { id } = await repo.create({ dueDate: '2025-12-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] });
    const failing: GenerationPipeline = { invoke: vi.fn().mockRejectedValue(new Error('pipeline boom')) };
    await expect(createGenerateProcessor({ repo, pipeline: failing })({ data: { assignmentId: id } })).rejects.toThrow('pipeline boom');
    const doc = await AssignmentModel.findById(id);
    expect(doc?.status).toBe('failed');
    expect(doc?.error).toContain('pipeline boom');
  });

  it('marks processing before invoking the pipeline', async () => {
    const { AssignmentModel } = await import('./models/assignment');
    const repo = createAssignmentRepository();
    const { id } = await repo.create({ dueDate: '2025-12-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] });
    let statusDuring: string | undefined;
    const observing: GenerationPipeline = { invoke: vi.fn().mockImplementation(async () => { statusDuring = (await AssignmentModel.findById(id))?.status; return validPaper; }) };
    await createGenerateProcessor({ repo, pipeline: observing })({ data: { assignmentId: id } });
    expect(statusDuring).toBe('processing');
  });
});
