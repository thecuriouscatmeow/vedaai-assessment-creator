import mongoose, { type Model, type Types } from 'mongoose';

/**
 * Mongoose model for the question_papers collection.
 *
 * Stores paper-level metadata and section titles/order — one document per
 * generated assignment. Questions live in a separate `questions` collection
 * (joined via the aggregate read path in the repository).
 *
 * schoolName / schoolAddress / className live here, never duplicated per question.
 */

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const studentInfoSchema = new mongoose.Schema(
  {
    name: { type: String },
    rollNumber: { type: String },
    section: { type: String },
  },
  { _id: false },
);

/** Section metadata — title and optional instruction only; no questions embedded. */
const sectionMetaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String },
    /** 0-based index; join key matched against questions.sectionIndex. */
    order: { type: Number, required: true },
  },
  { _id: false },
);

// ─── Document interface ───────────────────────────────────────────────────────

export interface QuestionPaperDoc {
  assignmentId: Types.ObjectId;
  title: string;
  schoolName: string;
  schoolAddress?: string;
  subject: string;
  className: string;
  totalMarks: number;
  durationMinutes?: number;
  generalInstructions?: string;
  studentInfo: { name?: string; rollNumber?: string; section?: string };
  sections: Array<{ title: string; instruction?: string; order: number }>;
}

// ─── Schema + index ──────────────────────────────────────────────────────────

const questionPaperSchema = new mongoose.Schema<QuestionPaperDoc>({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  schoolName: { type: String, required: true },
  schoolAddress: { type: String },
  subject: { type: String, required: true },
  className: { type: String, required: true },
  totalMarks: { type: Number, required: true },
  durationMinutes: { type: Number },
  generalInstructions: { type: String },
  studentInfo: { type: studentInfoSchema, default: {} },
  sections: { type: [sectionMetaSchema], required: true },
});

questionPaperSchema.index({ assignmentId: 1 }, { unique: true });

export const QuestionPaperModel: Model<QuestionPaperDoc> =
  (mongoose.models['QuestionPaper'] as Model<QuestionPaperDoc> | undefined) ??
  mongoose.model<QuestionPaperDoc>('QuestionPaper', questionPaperSchema);
