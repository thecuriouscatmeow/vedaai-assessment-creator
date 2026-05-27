import { z } from 'zod';

/**
 * AssignmentInput — the teacher-facing "Create Assignment" form payload.
 *
 * Validated at the API boundary before a generation job is queued. `fileUrl`
 * is a Cloudinary URL for an uploaded image of the source material (the
 * frontend uploads directly; the backend only stores the URL — never
 * base64/multer). The form mirrors the Figma "Upload Material Selector" screen:
 * an optional image, a due date, a table of question-type rows (each with a
 * count and marks), and a free-text hint for the model.
 */

/** Question types offered in the form's per-row dropdown (extensible). */
export const QuestionTypeSchema = z.enum(['mcq', 'short', 'diagram_graph', 'numerical']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * Canonical human labels for each question type — shared so the frontend
 * dropdown and the backend prompt use identical wording (matches the Figma
 * labels exactly).
 */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple Choice Questions',
  short: 'Short Questions',
  diagram_graph: 'Diagram/Graph-Based Questions',
  numerical: 'Numerical Problems',
};

/** One question-type row: how many questions of a given type and weight. */
export const QuestionSpecSchema = z.object({
  type: QuestionTypeSchema,
  count: z.number().int().positive(),
  marks: z.number().int().positive(),
});
export type QuestionSpec = z.infer<typeof QuestionSpecSchema>;

export const AssignmentInputSchema = z.object({
  fileUrl: z.url().optional(),
  dueDate: z.iso.date(),
  questions: z.array(QuestionSpecSchema).min(1),
  additionalInfo: z.string().optional(),
});
export type AssignmentInput = z.infer<typeof AssignmentInputSchema>;

/** Lifecycle status of an assignment generation job. */
export const AssignmentStatusSchema = z.enum(['queued', 'processing', 'done', 'failed']);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

/**
 * AssignmentSummary — the shape rendered as a card in the Assignments list.
 * `title` is derived from the generated paper (falls back to a placeholder
 * until generation completes). `assignedAt` is the creation timestamp.
 */
export const AssignmentSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: AssignmentStatusSchema,
  assignedAt: z.iso.datetime(),
  dueDate: z.iso.date(),
});
export type AssignmentSummary = z.infer<typeof AssignmentSummarySchema>;
