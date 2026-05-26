import { describe, it, expect } from 'vitest';
import { QuestionPaperSchema, DifficultySchema } from '../index';

const validPaper = {
  title: 'Mid-Term Examination',
  subject: 'Physics',
  totalMarks: 20,
  durationMinutes: 60,
  generalInstructions: 'Answer all questions.',
  studentInfo: { name: '', rollNumber: '', className: '', examDate: '' },
  sections: [
    {
      title: 'Section A — Multiple Choice',
      instruction: 'Choose the correct option.',
      questions: [
        { text: 'What is the SI unit of force?', difficulty: 'easy', marks: 2 },
        { text: 'State Newton’s second law.', difficulty: 'moderate', marks: 3 },
      ],
    },
  ],
};

describe('DifficultySchema', () => {
  it('accepts the three allowed difficulty levels', () => {
    expect(DifficultySchema.parse('easy')).toBe('easy');
    expect(DifficultySchema.parse('moderate')).toBe('moderate');
    expect(DifficultySchema.parse('hard')).toBe('hard');
  });

  it('rejects an unknown difficulty level', () => {
    expect(() => DifficultySchema.parse('medium')).toThrow();
  });
});

describe('QuestionPaperSchema', () => {
  it('accepts a valid question paper', () => {
    const parsed = QuestionPaperSchema.parse(validPaper);
    expect(parsed.sections[0]?.questions).toHaveLength(2);
  });

  it('rejects a paper with no sections', () => {
    expect(() => QuestionPaperSchema.parse({ ...validPaper, sections: [] })).toThrow();
  });

  it('rejects a section with no questions', () => {
    expect(() =>
      QuestionPaperSchema.parse({
        ...validPaper,
        sections: [{ title: 'Empty', questions: [] }],
      }),
    ).toThrow();
  });

  it('rejects empty question text', () => {
    expect(() =>
      QuestionPaperSchema.parse({
        ...validPaper,
        sections: [{ title: 'A', questions: [{ text: '', difficulty: 'easy', marks: 1 }] }],
      }),
    ).toThrow();
  });

  it('rejects non-positive marks on a question', () => {
    expect(() =>
      QuestionPaperSchema.parse({
        ...validPaper,
        sections: [{ title: 'A', questions: [{ text: 'Q', difficulty: 'easy', marks: 0 }] }],
      }),
    ).toThrow();
  });
});
