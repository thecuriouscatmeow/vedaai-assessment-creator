import mongoose, { type Model, type Types } from 'mongoose';

/**
 * Mongoose model for the questions collection.
 *
 * One document per question. Joined to question_papers via paperId.
 * sectionIndex + order determine placement when the repository reconstructs
 * the QuestionPaper shape via the aggregate read path.
 */

// ─── Document interface ───────────────────────────────────────────────────────

export interface QuestionDoc {
  paperId: Types.ObjectId;
  /** Matches the `order` field on the parent section in question_papers. */
  sectionIndex: number;
  /** 0-based position within the section. */
  order: number;
  text: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  marks: number;
  answer?: string;
}

// ─── Schema + index ──────────────────────────────────────────────────────────

const questionSchema = new mongoose.Schema<QuestionDoc>({
  paperId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sectionIndex: { type: Number, required: true },
  order: { type: Number, required: true },
  text: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging'],
    required: true,
  },
  marks: { type: Number, required: true },
  answer: { type: String },
});

/** Covers the aggregate $lookup + sort in a single scan. */
questionSchema.index({ paperId: 1, sectionIndex: 1, order: 1 });

export const QuestionModel: Model<QuestionDoc> =
  (mongoose.models['Question'] as Model<QuestionDoc> | undefined) ??
  mongoose.model<QuestionDoc>('Question', questionSchema);
