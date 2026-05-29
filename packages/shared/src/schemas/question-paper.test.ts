import { describe, it, expect } from 'vitest';
import { QuestionPaperSchema, DifficultySchema, GeneratedPaperSchema } from '../index';

const validPaper = {
  title: 'Mid-Term Examination',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Physics',
  className: '5th',
  totalMarks: 20,
  durationMinutes: 60,
  generalInstructions: 'Answer all questions.',
  studentInfo: { name: '', rollNumber: '', section: '' },
  sections: [
    {
      title: 'Section A — Multiple Choice',
      instruction: 'Choose the correct option.',
      questions: [
        { text: 'What is the SI unit of force?', difficulty: 'easy', marks: 2, answer: 'Newton' },
        { text: 'State Newton’s second law.', difficulty: 'moderate', marks: 3 },
      ],
    },
  ],
};

describe('DifficultySchema', () => {
  it('accepts the three allowed difficulty levels', () => {
    expect(DifficultySchema.parse('easy')).toBe('easy');
    expect(DifficultySchema.parse('moderate')).toBe('moderate');
    expect(DifficultySchema.parse('challenging')).toBe('challenging');
  });

  it('rejects an unknown difficulty level', () => {
    expect(() => DifficultySchema.parse('medium')).toThrow();
  });
});

describe('QuestionPaperSchema', () => {
  it('accepts a valid question paper', () => {
    const parsed = QuestionPaperSchema.parse(validPaper);
    expect(parsed.sections[0]?.questions).toHaveLength(2);
    expect(parsed.sections[0]?.questions[0]?.answer).toBe('Newton');
  });

  it('requires school identity and class', () => {
    const { schoolName: _schoolName, ...withoutSchool } = validPaper;
    expect(() => QuestionPaperSchema.parse(withoutSchool)).toThrow();
    const { className: _className, ...withoutClass } = validPaper;
    expect(() => QuestionPaperSchema.parse(withoutClass)).toThrow();
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

describe('GeneratedPaperSchema', () => {
  const academic = {
    title: 'Mid-Term',
    subject: 'Science',
    className: 'Class 5',
    totalMarks: 10,
    studentInfo: {},
    sections: [{ title: 'A', questions: [{ text: 'Q1?', difficulty: 'easy', marks: 10 }] }],
  };

  it('accepts a paper without school identity', () => {
    expect(() => GeneratedPaperSchema.parse(academic)).not.toThrow();
  });

  it('includes all academic fields from QuestionPaper', () => {
    const parsed = GeneratedPaperSchema.parse(academic);
    expect(parsed.title).toBe('Mid-Term');
    expect(parsed.subject).toBe('Science');
    expect(parsed.className).toBe('Class 5');
  });
});
