import mongoose, { type Model } from 'mongoose';
import type { AssignmentInput, AssignmentStatus, QuestionPaper } from '@vedaai/shared';

/**
 * Mongoose document for an assignment generation job.
 *
 * Stores the teacher's input, the current generation status, an optional title
 * (populated once done), and (once done) the produced QuestionPaper. The `_id`
 * doubles as the BullMQ job id so the Socket.IO room look-up is O(1).
 *
 * All typing flows from `@vedaai/shared` — no scattered defs here.
 * The repo layer maps documents to plain `AssignmentRecord` domain objects so
 * Mongoose types never leak past the repository boundary.
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

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'moderate', 'challenging'], required: true },
    marks: { type: Number, required: true },
    answer: { type: String },
  },
  { _id: false },
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    instruction: { type: String },
    questions: { type: [questionSchema], required: true },
  },
  { _id: false },
);

const studentInfoSchema = new mongoose.Schema(
  {
    name: { type: String },
    rollNumber: { type: String },
    section: { type: String },
  },
  { _id: false },
);

const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    schoolName: { type: String, required: true },
    schoolAddress: { type: String },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    durationMinutes: { type: Number },
    generalInstructions: { type: String },
    studentInfo: { type: studentInfoSchema, default: {} },
    sections: { type: [sectionSchema], required: true },
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
    paper: { type: paperSchema },
    error: { type: String },
  },
  { timestamps: true },
);

/**
 * Mongoose document fields (timestamps added by the schema). Kept internal to
 * the models layer — the repository maps it to the plain {@link AssignmentRecord}.
 */
interface AssignmentDoc {
  input: AssignmentInput;
  status: AssignmentStatus;
  title?: string;
  paper?: QuestionPaper;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Expose the raw Mongoose model only within the models layer. The repository
// maps it to AssignmentRecord; nothing else imports AssignmentModel directly.
export const AssignmentModel: Model<AssignmentDoc> =
  (mongoose.models['Assignment'] as Model<AssignmentDoc> | undefined) ??
  mongoose.model<AssignmentDoc>('Assignment', assignmentSchema);
