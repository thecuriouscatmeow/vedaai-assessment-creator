import { describe, it, expect, vi } from 'vitest';
import { createGeneratePaper } from './generate';

const validGenerated = {
  title: 'T', subject: 'Sci', className: 'Class 5', totalMarks: 10, studentInfo: {},
  sections: [{ title: 'A', questions: [{ text: 'Q?', difficulty: 'easy', marks: 10 }] }],
};

function fakeModel(result: unknown) {
  const invoke = vi.fn().mockResolvedValue(result);
  return { withStructuredOutput: vi.fn().mockReturnValue({ withRetry: vi.fn().mockReturnValue({ invoke }) }) } as never;
}

describe('createGeneratePaper', () => {
  it('returns a validated GeneratedPaper', async () => {
    const generate = createGeneratePaper(fakeModel(validGenerated));
    const paper = await generate({ input: { dueDate: '2025-01-01', questions: [{ type: 'mcq', count: 1, marks: 10 }] }, sourceText: 'src' });
    expect(paper.title).toBe('T');
  });

  it('throws when the model output fails our schema', async () => {
    const generate = createGeneratePaper(fakeModel({ title: 'broken' }));
    await expect(generate({ input: { dueDate: '2025-01-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] }, sourceText: '' })).rejects.toThrow();
  });
});
