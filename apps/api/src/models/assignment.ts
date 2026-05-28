import mongoose, { type Model, type Types } from 'mongoose';
import type { AssignmentInput, AssignmentStatus, QuestionPaper } from '@vedaai/shared';

/**
 * Mongoose document for an assignment generation job.
 *
 * Stores the teacher's input, lifecycle status, and a reference to the
 * generated QuestionPaper (paperId). The paper itself lives in the
 * question_papers + questions collections; the repository reconstructs the
 * full QuestionPaper via an aggregate read path.
 *
 * The `_id` doubles as the BullMQ job id so the Socket.IO room look-up is O(1).
 */

/** Plain domain record returned by the repository — no Mongoose Document. */
export interface AssignmentRecord {
  id: string;
  input: AssignmentInput;
  status: AssignmentStatus;
  title?: string;
  paper?: QuestionPaper;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mongoose sub-schemas ────────────────────────────────────────────────────

const questionSpecSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'short', 'diagram_graph', 'numerical'],
      required: true,
    },
    count: { type: Number, required: true },
    marks: { type: Number, required: true },
  },
  { _id: false },
);

const inputSchema = new mongoose.Schema(
  {
    fileUrl: { type: String },
    dueDate: { type: String, required: true },
    questions: { type: [questionSpecSchema], required: true },
    additionalInfo: { type: String },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema(
  {
    input: { type: inputSchema, required: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'failed'],
      required: true,
    },
    title: { type: String },
    /** Reference to the generated QuestionPaper; absent until status = done. */
    paperId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionPaper' },
    error: { type: String },
  },
  { timestamps: true },
);

assignmentSchema.index({ createdAt: -1 });

/**
 * Mongoose document fields (timestamps added by the schema). Kept internal to
 * the models layer — the repository maps it to the plain {@link AssignmentRecord}.
 */
interface AssignmentDoc {
  input: AssignmentInput;
  status: AssignmentStatus;
  title?: string;
  paperId?: Types.ObjectId;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Expose the raw Mongoose model only within the models layer. The repository
// maps it to AssignmentRecord; nothing else imports AssignmentModel directly.
export const AssignmentModel: Model<AssignmentDoc> =
  (mongoose.models['Assignment'] as Model<AssignmentDoc> | undefined) ??
  mongoose.model<AssignmentDoc>('Assignment', assignmentSchema);
