import { describe, it, expect } from 'vitest';
import { AssignmentInputSchema } from '../index';

const validInput = {
  fileUrl: 'https://res.cloudinary.com/demo/raw/upload/syllabus.pdf',
  dueDate: '2026-06-30',
  questionTypes: ['mcq', 'short'],
  questions: [
    { count: 5, marks: 2 },
    { count: 3, marks: 5 },
  ],
  instructions: 'Cover chapters 1-3.',
};

describe('AssignmentInputSchema', () => {
  it('accepts a fully populated valid input', () => {
    const parsed = AssignmentInputSchema.parse(validInput);
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.questionTypes).toContain('mcq');
  });

  it('accepts a minimal input without optional fileUrl/instructions', () => {
    const parsed = AssignmentInputSchema.parse({
      dueDate: '2026-06-30',
      questionTypes: ['long'],
      questions: [{ count: 1, marks: 10 }],
    });
    expect(parsed.fileUrl).toBeUndefined();
    expect(parsed.instructions).toBeUndefined();
  });

  it('rejects an empty questionTypes array', () => {
    expect(() => AssignmentInputSchema.parse({ ...validInput, questionTypes: [] })).toThrow();
  });

  it('rejects an empty questions array', () => {
    expect(() => AssignmentInputSchema.parse({ ...validInput, questions: [] })).toThrow();
  });

  it('rejects a non-positive question count', () => {
    expect(() =>
      AssignmentInputSchema.parse({ ...validInput, questions: [{ count: 0, marks: 2 }] }),
    ).toThrow();
  });

  it('rejects a non-integer question count', () => {
    expect(() =>
      AssignmentInputSchema.parse({ ...validInput, questions: [{ count: 1.5, marks: 2 }] }),
    ).toThrow();
  });

  it('rejects negative marks', () => {
    expect(() =>
      AssignmentInputSchema.parse({ ...validInput, questions: [{ count: 1, marks: -2 }] }),
    ).toThrow();
  });

  it('rejects a malformed fileUrl', () => {
    expect(() => AssignmentInputSchema.parse({ ...validInput, fileUrl: 'not-a-url' })).toThrow();
  });
});
