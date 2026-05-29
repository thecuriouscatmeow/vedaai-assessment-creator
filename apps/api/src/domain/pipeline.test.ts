import { describe, it, expect, vi } from 'vitest';
import { createPipeline } from './pipeline';
import { SCHOOL_NAME, SCHOOL_ADDRESS } from '../lib/school';

const generated = {
  title: 'T', subject: 'Sci', className: 'Class 5', totalMarks: 10, studentInfo: {},
  sections: [{ title: 'A', questions: [{ text: 'Q?', difficulty: 'easy', marks: 10 }] }],
};

describe('createPipeline', () => {
  it('extracts, generates, then merges school identity into a full QuestionPaper', async () => {
    const extraction = { extractText: vi.fn().mockResolvedValue('source') };
    const generate = vi.fn().mockResolvedValue(generated);
    const pipeline = createPipeline({ extraction, generate });

    const input = { fileUrl: 'https://x/a.pdf', dueDate: '2025-01-01', questions: [{ type: 'mcq' as const, count: 1, marks: 10 }] };
    const paper = await pipeline.invoke(input);

    expect(extraction.extractText).toHaveBeenCalledWith(input);
    expect(generate).toHaveBeenCalledWith({ input, sourceText: 'source' });
    expect(paper.schoolName).toBe(SCHOOL_NAME);
    expect(paper.schoolAddress).toBe(SCHOOL_ADDRESS);
    expect(paper.title).toBe('T');
  });
});
