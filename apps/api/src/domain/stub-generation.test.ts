import { describe, it, expect } from 'vitest';
import { QuestionPaperSchema } from '@vedaai/shared';
import { buildStubPaper } from './stub-generation';

describe('buildStubPaper', () => {
  it('produces a paper that satisfies the frozen QuestionPaper contract', () => {
    const paper = buildStubPaper('abc-123');
    expect(() => QuestionPaperSchema.parse(paper)).not.toThrow();
  });

  it('embeds the assignment id so the skeleton round-trip is verifiable', () => {
    expect(buildStubPaper('abc-123').title).toContain('abc-123');
  });
});
