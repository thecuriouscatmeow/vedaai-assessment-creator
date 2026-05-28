/**
 * Integration tests for the normalized assignment repository.
 *
 * Verifies the aggregate read path (assignments → question_papers → questions),
 * the 3-step setDone write path, and the cascade deleteById.
 * Uses mongodb-memory-server — no real Atlas connection needed.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { QuestionPaperSchema } from '@vedaai/shared';
import { createAssignmentRepository } from './assignment.repository';
import { QuestionPaperModel } from '../../models/question-paper';
import { QuestionModel } from '../../models/question';
import { AssignmentModel } from '../../models/assignment';
import type { AssignmentRepository } from './assignment.repository';

let mongod: MongoMemoryServer;
let repo: AssignmentRepository;

const validInput = {
  dueDate: '2025-12-01',
  questions: [{ type: 'short' as const, count: 2, marks: 10 }],
};

const validPaper = {
  title: 'Science Test',
  schoolName: 'Delhi Public School',
  schoolAddress: '42 Park Street',
  subject: 'Science',
  className: 'Class 10',
  totalMarks: 40,
  durationMinutes: 60,
  generalInstructions: 'Attempt all questions.',
  studentInfo: { name: '', rollNumber: '', section: '' },
  sections: [
    {
      title: 'Section A',
      instruction: 'Short answers',
      questions: [
        { text: 'Define photosynthesis.', difficulty: 'easy' as const, marks: 5 },
        { text: 'Explain osmosis.', difficulty: 'moderate' as const, marks: 5 },
      ],
    },
    {
      title: 'Section B',
      questions: [
        { text: 'Long answer on Newton.', difficulty: 'challenging' as const, marks: 15 },
        { text: 'Describe cell division.', difficulty: 'moderate' as const, marks: 15 },
      ],
    },
  ],
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  repo = createAssignmentRepository();
}, 30_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const cols = mongoose.connection.collections;
  for (const key in cols) {
    await cols[key]?.deleteMany({});
  }
});

describe('setDone + findById round-trip', () => {
  it('findById returns a QuestionPaper matching the frozen Zod schema', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const record = await repo.findById(id);
    expect(record).not.toBeNull();
    expect(() => QuestionPaperSchema.parse(record!.paper)).not.toThrow();
  });

  it('paper fields match exactly what was passed to setDone', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const record = await repo.findById(id);
    const paper = record!.paper!;
    expect(paper.title).toBe('Science Test');
    expect(paper.schoolName).toBe('Delhi Public School');
    expect(paper.schoolAddress).toBe('42 Park Street');
    expect(paper.subject).toBe('Science');
    expect(paper.className).toBe('Class 10');
    expect(paper.totalMarks).toBe(40);
    expect(paper.durationMinutes).toBe(60);
    expect(paper.generalInstructions).toBe('Attempt all questions.');
  });

  it('schoolName appears at paper level only — not duplicated on questions', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const questions = await QuestionModel.find({}).lean().exec();
    for (const q of questions) {
      expect((q as unknown as Record<string, unknown>)['schoolName']).toBeUndefined();
    }
    const papers = await QuestionPaperModel.find({}).lean().exec();
    expect(papers[0]?.schoolName).toBe('Delhi Public School');
  });

  it('sections and questions maintain insertion order', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const record = await repo.findById(id);
    const sections = record!.paper!.sections;

    expect(sections[0]!.title).toBe('Section A');
    expect(sections[0]!.questions[0]!.text).toBe('Define photosynthesis.');
    expect(sections[0]!.questions[1]!.text).toBe('Explain osmosis.');

    expect(sections[1]!.title).toBe('Section B');
    expect(sections[1]!.questions[0]!.text).toBe('Long answer on Newton.');
    expect(sections[1]!.questions[1]!.text).toBe('Describe cell division.');
  });

  it('findById returns paper:undefined for a queued assignment', async () => {
    const { id } = await repo.create(validInput);
    const record = await repo.findById(id);

    expect(record).not.toBeNull();
    expect(record!.status).toBe('queued');
    expect(record!.paper).toBeUndefined();
  });

  it('status transitions to done and title is set after setDone', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const record = await repo.findById(id);
    expect(record!.status).toBe('done');
    expect(record!.title).toBe('Science Test');
  });

  it('stores questions in the questions collection with correct shape', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const qs = await QuestionModel.find({}).lean().exec();
    expect(qs).toHaveLength(4); // 2 + 2
    const sec0 = qs.filter((q) => q.sectionIndex === 0).sort((a, b) => a.order - b.order);
    const sec1 = qs.filter((q) => q.sectionIndex === 1).sort((a, b) => a.order - b.order);
    expect(sec0[0]!.text).toBe('Define photosynthesis.');
    expect(sec0[1]!.text).toBe('Explain osmosis.');
    expect(sec1[0]!.text).toBe('Long answer on Newton.');
    expect(sec1[1]!.difficulty).toBe('moderate');
  });
});

describe('deleteById cascade', () => {
  it('removes the assignment, its question_paper, and all questions', async () => {
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    await repo.deleteById(id);

    expect(await AssignmentModel.findById(id)).toBeNull();
    expect(await QuestionPaperModel.findOne({ assignmentId: new mongoose.Types.ObjectId(id) })).toBeNull();
    expect(await QuestionModel.countDocuments()).toBe(0);
  });

  it('deleteById on a queued assignment (no paper) does not throw', async () => {
    const { id } = await repo.create(validInput);
    await expect(repo.deleteById(id)).resolves.toBeUndefined();
    expect(await AssignmentModel.findById(id)).toBeNull();
  });

  it('deleteById throws NotFoundError for unknown id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(repo.deleteById(fakeId)).rejects.toThrow('not found');
  });
});

describe('listAll', () => {
  it('returns summaries sorted newest first regardless of paper state', async () => {
    await repo.create(validInput);
    const { id: doneId } = await repo.create(validInput);
    await repo.setDone(doneId, validPaper, validPaper.title);

    const summaries = await repo.listAll();
    expect(summaries).toHaveLength(2);
    // newest first — done assignment was created second
    expect(summaries[0]!.id).toBe(doneId);
    expect(summaries[0]!.status).toBe('done');
    expect(summaries[1]!.status).toBe('queued');
  });

  it('uses paper title when set, falls back to "Untitled assignment"', async () => {
    await repo.create(validInput);
    const { id } = await repo.create(validInput);
    await repo.setDone(id, validPaper, validPaper.title);

    const summaries = await repo.listAll();
    const done = summaries.find((s) => s.id === id)!;
    const queued = summaries.find((s) => s.id !== id)!;
    expect(done.title).toBe('Science Test');
    expect(queued.title).toBe('Untitled assignment');
  });
});
