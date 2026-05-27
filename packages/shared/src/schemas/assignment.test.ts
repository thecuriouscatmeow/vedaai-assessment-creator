import { describe, it, expect } from 'vitest';
import {
  AssignmentInputSchema,
  AssignmentStatusSchema,
  AssignmentSummarySchema,
  QuestionTypeSchema,
  QUESTION_TYPE_LABELS,
} from '../index';

const validInput = {
  fileUrl: 'https://res.cloudinary.com/demo/image/upload/material.png',
  dueDate: '2026-06-30',
  questions: [
    { type: 'mcq', count: 5, marks: 2 },
    { type: 'short', count: 3, marks: 5 },
  ],
  additionalInfo: 'Cover chapters 1-3.',
};

describe('AssignmentInputSchema', () => {
  it('accepts a fully populated valid input', () => {
    const parsed = AssignmentInputSchema.parse(validInput);
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questions[0]?.type).toBe('mcq');
  });

  it('accepts a minimal input without optional fileUrl/additionalInfo', () => {
    const parsed = AssignmentInputSchema.parse({
      dueDate: '2026-06-30',
      questions: [{ type: 'numerical', count: 1, marks: 10 }],
    });
    expect(parsed.fileUrl).toBeUndefined();
    expect(parsed.additionalInfo).toBeUndefined();
  });

  it('rejects an empty questions array', () => {
    expect(() => AssignmentInputSchema.parse({ ...validInput, questions: [] })).toThrow();
  });

  it('rejects an unknown question type', () => {
    expect(() =>
      AssignmentInputSchema.parse({
        ...validInput,
        questions: [{ type: 'essay', count: 1, marks: 2 }],
      }),
    ).toThrow();
  });

  it('rejects a non-positive question count', () => {
    expect(() =>
      AssignmentInputSchema.parse({
        ...validInput,
        questions: [{ type: 'mcq', count: 0, marks: 2 }],
      }),
    ).toThrow();
  });

  it('rejects a non-integer question count', () => {
    expect(() =>
      AssignmentInputSchema.parse({
        ...validInput,
        questions: [{ type: 'mcq', count: 1.5, marks: 2 }],
      }),
    ).toThrow();
  });

  it('rejects negative marks', () => {
    expect(() =>
      AssignmentInputSchema.parse({
        ...validInput,
        questions: [{ type: 'mcq', count: 1, marks: -2 }],
      }),
    ).toThrow();
  });

  it('rejects a malformed fileUrl', () => {
    expect(() => AssignmentInputSchema.parse({ ...validInput, fileUrl: 'not-a-url' })).toThrow();
  });
});

describe('QuestionTypeSchema', () => {
  it('accepts the four supported types and exposes a label for each', () => {
    for (const type of QuestionTypeSchema.options) {
      expect(QuestionTypeSchema.parse(type)).toBe(type);
      expect(QUESTION_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe('AssignmentStatusSchema', () => {
  it('accepts known statuses and rejects unknown ones', () => {
    expect(AssignmentStatusSchema.parse('queued')).toBe('queued');
    expect(AssignmentStatusSchema.parse('processing')).toBe('processing');
    expect(() => AssignmentStatusSchema.parse('paused')).toThrow();
  });
});

describe('AssignmentSummarySchema', () => {
  it('accepts a valid summary card payload', () => {
    const parsed = AssignmentSummarySchema.parse({
      id: 'a1',
      title: 'Quiz on Electricity',
      status: 'done',
      assignedAt: '2026-05-20T10:00:00.000Z',
      dueDate: '2026-06-21',
    });
    expect(parsed.title).toBe('Quiz on Electricity');
  });

  it('rejects a summary with an empty title', () => {
    expect(() =>
      AssignmentSummarySchema.parse({
        id: 'a1',
        title: '',
        status: 'queued',
        assignedAt: '2026-05-20T10:00:00.000Z',
        dueDate: '2026-06-21',
      }),
    ).toThrow();
  });
});
