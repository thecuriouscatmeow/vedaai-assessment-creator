import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AssignmentModel } from './assignment';

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
  await AssignmentModel.deleteMany({});
});

describe('AssignmentModel', () => {
  it('saves a document with queued status and input using new schema', async () => {
    const doc = await AssignmentModel.create({
      input: {
        dueDate: '2025-12-01',
        questions: [{ type: 'mcq', count: 5, marks: 2 }],
      },
      status: 'queued',
    });

    expect(doc._id).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = doc.toObject() as any;
    expect(raw.status).toBe('queued');
    expect(raw.input.dueDate).toBe('2025-12-01');
    expect(raw.createdAt).toBeDefined();
    expect(raw.updatedAt).toBeDefined();
  });

  it('rejects a document with invalid status', async () => {
    await expect(
      AssignmentModel.create({
        input: { dueDate: '2025-12-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'unknown-status' as any,
      }),
    ).rejects.toThrow();
  });

  it('accepts paperId field when present (done status without embedded paper)', async () => {
    const fakeId = new (await import('mongoose')).default.Types.ObjectId();
    const doc = await AssignmentModel.create({
      input: {
        dueDate: '2025-12-01',
        questions: [{ type: 'short', count: 3, marks: 5 }],
      },
      status: 'done',
      title: 'Science Test',
      paperId: fakeId,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = doc.toObject() as any;
    expect(raw.title).toBe('Science Test');
    expect(raw.paperId?.toString()).toBe(fakeId.toString());
    expect(raw.paper).toBeUndefined();
  });
});
