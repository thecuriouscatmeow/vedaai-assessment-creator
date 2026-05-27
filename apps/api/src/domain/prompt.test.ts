import { describe, it, expect } from 'vitest';
import { buildPrompt } from './prompt';
import type { AssignmentInput } from '@vedaai/shared';

const baseInput: AssignmentInput = {
  dueDate: '2025-12-01',
  questionTypes: ['mcq', 'short'],
  questions: [
    { count: 5, marks: 2 },
    { count: 3, marks: 5 },
  ],
};

describe('buildPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildPrompt(baseInput);
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(50);
  });

  it('snapshot: includes question types in the prompt', () => {
    const prompt = buildPrompt(baseInput);
    expect(prompt).toContain('mcq');
    expect(prompt).toContain('short');
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
    // count: 5, marks: 2
    expect(prompt).toContain('5');
    expect(prompt).toContain('2');
    // count: 3, marks: 5
    expect(prompt).toContain('3');
  });

  it('includes optional instructions when provided', () => {
    const input: AssignmentInput = { ...baseInput, instructions: 'Focus on chapter 3 only.' };
    const prompt = buildPrompt(input);
    expect(prompt).toContain('Focus on chapter 3 only.');
  });

  it('includes fileUrl context when provided', () => {
    const input: AssignmentInput = {
      ...baseInput,
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
    };
    const prompt = buildPrompt(input);
    expect(prompt).toContain('https://res.cloudinary.com/demo/image/upload/sample.pdf');
  });
});
