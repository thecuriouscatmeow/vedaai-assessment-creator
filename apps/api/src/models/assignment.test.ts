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
  it('saves a document with queued status and input', async () => {
    const doc = await AssignmentModel.create({
      input: {
        dueDate: '2025-12-01',
        questionTypes: ['mcq'],
        questions: [{ count: 5, marks: 2 }],
      },
      status: 'queued',
    });

    expect(doc._id).toBeDefined();
    expect(doc.status).toBe('queued');
    expect(doc.input.dueDate).toBe('2025-12-01');
    expect(doc.createdAt).toBeDefined();
    expect(doc.updatedAt).toBeDefined();
  });

  it('rejects a document with invalid status', async () => {
    await expect(
      AssignmentModel.create({
        input: { dueDate: '2025-12-01', questionTypes: ['mcq'], questions: [{ count: 1, marks: 1 }] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'unknown-status' as any,
      }),
    ).rejects.toThrow();
  });

  it('stores paper when status is done', async () => {
    const doc = await AssignmentModel.create({
      input: {
        dueDate: '2025-12-01',
        questionTypes: ['short'],
        questions: [{ count: 3, marks: 5 }],
      },
      status: 'done',
      paper: {
        title: 'Test Paper',
        subject: 'Science',
        totalMarks: 15,
        studentInfo: {},
        sections: [
          {
            title: 'Section A',
            questions: [{ text: 'Q1?', difficulty: 'easy', marks: 5 }],
          },
        ],
      },
    });

    expect(doc.paper?.title).toBe('Test Paper');
    expect(doc.paper?.totalMarks).toBe(15);
  });
});
