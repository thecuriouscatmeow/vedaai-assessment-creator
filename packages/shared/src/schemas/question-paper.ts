import { z } from 'zod';

/**
 * QuestionPaper — the LLM output contract.
 *
 * This is what the worker must produce (and Zod-validate, with one repair
 * retry) before it is persisted and rendered as an exam paper. Every field is
 * constrained so a malformed generation is rejected rather than shown.
 */

export const DifficultySchema = z.enum(['easy', 'moderate', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const QuestionSchema = z.object({
  text: z.string().min(1),
  difficulty: DifficultySchema,
  marks: z.number().int().positive(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const SectionSchema = z.object({
  title: z.string().min(1),
  instruction: z.string().optional(),
  questions: z.array(QuestionSchema).min(1),
});
export type Section = z.infer<typeof SectionSchema>;

/** Blank placeholders rendered at the top of the printed paper. */
export const StudentInfoSchema = z.object({
  name: z.string().optional(),
  rollNumber: z.string().optional(),
  className: z.string().optional(),
  examDate: z.string().optional(),
});
export type StudentInfo = z.infer<typeof StudentInfoSchema>;

export const QuestionPaperSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  totalMarks: z.number().int().positive(),
  durationMinutes: z.number().int().positive().optional(),
  generalInstructions: z.string().optional(),
  studentInfo: StudentInfoSchema,
  sections: z.array(SectionSchema).min(1),
});
export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;
