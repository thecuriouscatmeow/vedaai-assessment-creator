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

  it('stores a paper with new schema fields (schoolName, className, challenging difficulty)', async () => {
    const doc = await AssignmentModel.create({
      input: {
        dueDate: '2025-12-01',
        questions: [{ type: 'short', count: 3, marks: 5 }],
      },
      status: 'done',
      title: 'Science Test',
      paper: {
        title: 'Science Test',
        schoolName: 'Delhi Public School, Sector-4, Bokaro',
        subject: 'Science',
        className: 'Class 10',
        totalMarks: 15,
        studentInfo: {},
        sections: [
          {
            title: 'Section A',
            questions: [{ text: 'Q1?', difficulty: 'challenging', marks: 5 }],
          },
        ],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = doc.toObject() as any;
    expect(raw.paper?.title).toBe('Science Test');
    expect(raw.paper?.schoolName).toBe('Delhi Public School, Sector-4, Bokaro');
    expect(raw.paper?.className).toBe('Class 10');
    expect(raw.paper?.sections?.[0]?.questions?.[0]?.difficulty).toBe('challenging');
    expect(raw.title).toBe('Science Test');
  });

  it('rejects "hard" difficulty (only easy|moderate|challenging allowed)', async () => {
    await expect(
      AssignmentModel.create({
        input: { dueDate: '2025-12-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] },
        status: 'done',
        paper: {
          title: 'T',
          schoolName: 'S',
          subject: 'S',
          className: 'C',
          totalMarks: 1,
          studentInfo: {},
          sections: [
            {
              title: 'A',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              questions: [{ text: 'Q?', difficulty: 'hard' as any, marks: 1 }],
            },
          ],
        },
      }),
    ).rejects.toThrow();
  });
});
