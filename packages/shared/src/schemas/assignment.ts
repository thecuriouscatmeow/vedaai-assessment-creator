import { z } from 'zod';

/**
 * AssignmentInput — the teacher-facing form payload.
 *
 * Validated at the API boundary before a generation job is queued. `fileUrl`
 * is a Cloudinary URL (frontend uploads directly; the backend only stores the
 * URL — never base64/multer).
 */

export const QuestionTypeSchema = z.enum(['mcq', 'short', 'long', 'truefalse', 'fillblank']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/** How many questions of a given weight to generate. */
export const QuestionSpecSchema = z.object({
  count: z.number().int().positive(),
  marks: z.number().int().positive(),
});
export type QuestionSpec = z.infer<typeof QuestionSpecSchema>;

export const AssignmentInputSchema = z.object({
  fileUrl: z.url().optional(),
  dueDate: z.iso.date(),
  questionTypes: z.array(QuestionTypeSchema).min(1),
  questions: z.array(QuestionSpecSchema).min(1),
  instructions: z.string().optional(),
});
export type AssignmentInput = z.infer<typeof AssignmentInputSchema>;
