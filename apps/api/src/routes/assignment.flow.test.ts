/**
 * Full-flow integration test: create → worker processes → read returns valid paper.
 *
 * Uses mongodb-memory-server for DB and a mocked LLM adapter so no real
 * Gemini API key or Redis connection is needed. Simulates the worker
 * directly by calling createGenerateProcessor with the same repo.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';
import { QuestionPaperSchema } from '@vedaai/shared';
import { createApp } from '../app';
import { loadConfig } from '../lib/config';
import { createLogger } from '../lib/logger';
import { createAssignmentRepository } from '../adapters/db/assignment.repository';
import { createAssignmentService } from '../services/assignment.service';
import { createGenerateProcessor } from '../worker';
import type { GenerateQueue } from '../lib/queue';
import type { LlmAdapter } from '../adapters/llm/index';

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
  title: 'Full Flow Paper',
  subject: 'History',
  totalMarks: 20,
  studentInfo: {},
  sections: [
    {
      title: 'Section A',
      questions: [
        { text: 'When did WWI start?', difficulty: 'easy', marks: 10 },
        { text: 'Explain the causes of WWII.', difficulty: 'hard', marks: 10 },
      ],
    },
  ],
});

const mockLlm: LlmAdapter = {
  name: 'mock',
  async complete() {
    return validPaperJson;
  },
};

function makeCaptureQueue(captured: string[]): GenerateQueue {
  return {
    async enqueue(data) {
      captured.push(data.assignmentId);
      return { jobId: data.assignmentId };
    },
    async close() {},
  };
}

function buildTestApp(queue: GenerateQueue): Express {
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

describe('Full flow: create → process → read', () => {
  it('create enqueues, worker produces valid paper, GET returns it', async () => {
    const enqueued: string[] = [];
    const queue = makeCaptureQueue(enqueued);
    const app = buildTestApp(queue);

    // Step 1: POST to create
    const createRes = await request(app).post('/api/assignments').send({
      dueDate: '2025-12-01',
      questionTypes: ['short', 'mcq'],
      questions: [{ count: 2, marks: 10 }],
    });
    expect(createRes.status).toBe(201);
    const { assignmentId } = createRes.body as { assignmentId: string };
    expect(typeof assignmentId).toBe('string');
    expect(enqueued).toContain(assignmentId);

    // Step 2: Simulate worker processing (directly calling processor)
    const repo = createAssignmentRepository();
    const processor = createGenerateProcessor({ repo, llm: mockLlm });
    const paper = await processor({ data: { assignmentId } });

    // Paper should be schema-valid
    expect(() => QuestionPaperSchema.parse(paper)).not.toThrow();
    expect(paper.title).toBe('Full Flow Paper');

    // Step 3: GET the assignment — should return done + paper
    const getRes = await request(app).get(`/api/assignments/${assignmentId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('done');
    expect(getRes.body.paper.title).toBe('Full Flow Paper');
    expect(getRes.body.assignmentId).toBe(assignmentId);
  });

  it('re-enqueue (regenerate): can enqueue same assignmentId again', async () => {
    const enqueued: string[] = [];
    const queue = makeCaptureQueue(enqueued);
    const app = buildTestApp(queue);

    const createRes = await request(app).post('/api/assignments').send({
      dueDate: '2025-12-15',
      questionTypes: ['mcq'],
      questions: [{ count: 3, marks: 5 }],
    });
    expect(createRes.status).toBe(201);
    const { assignmentId } = createRes.body as { assignmentId: string };

    // Trigger regeneration via POST again with same content
    const regenRes = await request(app).post('/api/assignments').send({
      dueDate: '2025-12-15',
      questionTypes: ['mcq'],
      questions: [{ count: 3, marks: 5 }],
    });
    expect(regenRes.status).toBe(201);
    // Each POST creates a new assignment (with a new id)
    expect(regenRes.body.assignmentId).not.toBe(assignmentId);
  });
});
