import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { createApp } from '../app';
import { loadConfig } from '../lib/config';
import { createLogger } from '../lib/logger';
import { createAssignmentRepository } from '../adapters/db/assignment.repository';
import { createAssignmentService } from '../services/assignment.service';
import type { GenerateQueue } from '../lib/queue';

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

function makeFakeQueue(overrides?: Partial<GenerateQueue>): GenerateQueue {
  return {
    async enqueue() {
      return { jobId: 'fake-job' };
    },
    async close() {},
    ...overrides,
  };
}

function buildTestApp(queue: GenerateQueue = makeFakeQueue()): Express {
  const config = loadConfig({
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri(),
    REDIS_URL: 'redis://localhost:6379',
    GEMINI_API_KEY: 'gem-key',
    CLOUDINARY_CLOUD_NAME: 'demo',
    CLOUDINARY_API_KEY: 'cl-key',
    CLOUDINARY_API_SECRET: 'cl-secret',
  });
  const logger = createLogger({ ...config, logLevel: 'silent' });
  const repo = createAssignmentRepository();
  const assignmentService = createAssignmentService({ repo, queue });
  return createApp({ config, logger, deps: { assignmentService } });
}

const validPayload = {
  dueDate: '2025-12-01',
  questionTypes: ['mcq' as const],
  questions: [{ count: 5, marks: 2 }],
};

describe('POST /api/assignments', () => {
  it('returns 201 with assignmentId for valid input', async () => {
    const res = await request(buildTestApp()).post('/api/assignments').send(validPayload);
    expect(res.status).toBe(201);
    expect(typeof res.body.assignmentId).toBe('string');
    expect(res.body.assignmentId.length).toBeGreaterThan(0);
  });

  it('persists assignment as queued in the database', async () => {
    const { AssignmentModel } = await import('../models/assignment');
    const res = await request(buildTestApp()).post('/api/assignments').send(validPayload);
    expect(res.status).toBe(201);

    const doc = await AssignmentModel.findById(res.body.assignmentId);
    expect(doc).not.toBeNull();
    expect(doc?.status).toBe('queued');
    expect(doc?.input.questionTypes).toEqual(['mcq']);
  });

  it('enqueues a generate job with the assignmentId', async () => {
    const enqueued: string[] = [];
    const queue = makeFakeQueue({
      async enqueue(data) {
        enqueued.push(data.assignmentId);
        return { jobId: data.assignmentId };
      },
    });

    const res = await request(buildTestApp(queue)).post('/api/assignments').send(validPayload);
    expect(res.status).toBe(201);
    expect(enqueued).toContain(res.body.assignmentId);
  });

  it('returns 400 with Zod error envelope for invalid input (missing questionTypes)', async () => {
    const res = await request(buildTestApp())
      .post('/api/assignments')
      .send({ dueDate: '2025-12-01', questions: [{ count: 1, marks: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
    expect(res.body.error.issues).toBeDefined();
    expect(Array.isArray(res.body.error.issues)).toBe(true);
  });

  it('returns 400 for empty questionTypes array', async () => {
    const res = await request(buildTestApp())
      .post('/api/assignments')
      .send({ ...validPayload, questionTypes: [] });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid questionType enum value', async () => {
    const res = await request(buildTestApp())
      .post('/api/assignments')
      .send({ ...validPayload, questionTypes: ['unknown-type'] });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/assignments/:id', () => {
  it('returns 200 with assignment data when found', async () => {
    const { AssignmentModel } = await import('../models/assignment');
    const doc = await AssignmentModel.create({
      input: validPayload,
      status: 'queued',
    });

    const res = await request(buildTestApp()).get(`/api/assignments/${String(doc._id)}`);
    expect(res.status).toBe(200);
    expect(res.body.assignmentId).toBe(String(doc._id));
    expect(res.body.status).toBe('queued');
  });

  it('returns 404 for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(buildTestApp()).get(`/api/assignments/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.error.status).toBe(404);
  });

  it('returns 400 for malformed id', async () => {
    const res = await request(buildTestApp()).get('/api/assignments/not-a-valid-id');
    expect(res.status).toBe(400);
  });
});
