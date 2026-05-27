import { describe, it, expect, vi } from 'vitest';
import { parsePaper } from './parse';
import type { LlmAdapter } from '../adapters/llm/index';

const validPaper = {
  title: 'Final Exam',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Mathematics',
  className: 'Class 8',
  totalMarks: 10,
  studentInfo: {},
  sections: [
    {
      title: 'Section A',
      questions: [{ text: 'What is 2+2?', difficulty: 'easy', marks: 10 }],
    },
  ],
};

const validJson = JSON.stringify(validPaper);

function makeMockLlm(responses: string[]): LlmAdapter {
  let callCount = 0;
  return {
    name: 'mock',
    async complete() {
      const response = responses[callCount] ?? responses[responses.length - 1] ?? '';
      callCount++;
      return response;
    },
  };
}

describe('parsePaper', () => {
  it('parses a valid JSON string into a QuestionPaper', async () => {
    const llm = makeMockLlm([validJson]);
    const result = await parsePaper(validJson, llm);
    expect(result.title).toBe('Final Exam');
    expect(result.subject).toBe('Mathematics');
    expect(result.sections).toHaveLength(1);
  });

  it('performs one repair-retry when the first response is malformed JSON', async () => {
    // The spy is only called for the repair step; parsePaper receives the raw
    // string directly and never calls llm.complete for the initial parse attempt.
    const completeSpy = vi.fn().mockResolvedValueOnce(validJson);

    const llm: LlmAdapter = { name: 'mock', complete: completeSpy };

    const result = await parsePaper('this is not json at all', llm);
    expect(result.title).toBe('Final Exam');
    // Should have called complete exactly once for the repair
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('performs one repair-retry when JSON is valid but schema is invalid', async () => {
    const badSchema = JSON.stringify({ title: 'Bad', subject: 'X', totalMarks: -5, studentInfo: {}, sections: [] });
    const completeSpy = vi.fn().mockResolvedValueOnce(validJson);

    const llm: LlmAdapter = { name: 'mock', complete: completeSpy };

    const result = await parsePaper(badSchema, llm);
    expect(result.title).toBe('Final Exam');
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('throws after one failed repair-retry', async () => {
    const alwaysBad = 'still not json';
    const completeSpy = vi.fn().mockResolvedValue(alwaysBad);

    const llm: LlmAdapter = { name: 'mock', complete: completeSpy };

    await expect(parsePaper(alwaysBad, llm)).rejects.toThrow();
    // Should have attempted exactly one repair
    expect(completeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not call the LLM when the first response is already valid', async () => {
    const completeSpy = vi.fn();
    const llm: LlmAdapter = { name: 'mock', complete: completeSpy };

    await parsePaper(validJson, llm);
    expect(completeSpy).not.toHaveBeenCalled();
  });
});
