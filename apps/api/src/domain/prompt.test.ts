import { describe, it, expect } from 'vitest';
import { QUESTION_TYPE_LABELS, type AssignmentInput } from '@vedaai/shared';
import { buildPrompt } from './prompt';

const baseInput: AssignmentInput = {
  dueDate: '2025-12-01',
  questions: [
    { type: 'mcq', count: 5, marks: 2 },
    { type: 'short', count: 3, marks: 5 },
  ],
};

describe('buildPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildPrompt(baseInput);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
  });

  it('includes the human label for each requested question type', () => {
    const prompt = buildPrompt(baseInput);
    expect(prompt).toContain(QUESTION_TYPE_LABELS.mcq);
    expect(prompt).toContain(QUESTION_TYPE_LABELS.short);
  });

  it('includes the due date in the prompt', () => {
    const prompt = buildPrompt(baseInput);
    expect(prompt).toContain('2025-12-01');
  });

  it('instructs the model to return JSON matching QuestionPaper schema', () => {
    const prompt = buildPrompt(baseInput);
    expect(prompt.toLowerCase()).toContain('json');
    expect(prompt).toContain('QuestionPaper');
  });

  it('includes count and marks for each question spec', () => {
    const prompt = buildPrompt(baseInput);
    expect(prompt).toContain('5 question(s), 2 mark(s)');
    expect(prompt).toContain('3 question(s), 5 mark(s)');
  });

  it('includes optional additionalInfo when provided', () => {
    const input: AssignmentInput = { ...baseInput, additionalInfo: 'Focus on chapter 3 only.' };
    const prompt = buildPrompt(input);
    expect(prompt).toContain('Focus on chapter 3 only.');
  });

  it('mentions the attached material when a fileUrl is provided', () => {
    const input: AssignmentInput = {
      ...baseInput,
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
    };
    const prompt = buildPrompt(input);
    expect(prompt.toLowerCase()).toContain('attached');
  });
});
