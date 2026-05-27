import mongoose, { type Document, type Model } from 'mongoose';
import type { AssignmentInput, QuestionPaper } from '@vedaai/shared';

/**
 * Mongoose document for an assignment generation job.
 *
 * Stores the teacher's input, the current generation status, and (once done)
 * the produced QuestionPaper. The `_id` doubles as the BullMQ job id so the
 * Socket.IO room look-up is O(1).
 *
 * All typing flows from `@vedaai/shared` — no scattered defs here.
 */

export interface AssignmentDocument extends Document {
  input: AssignmentInput;
  status: 'queued' | 'processing' | 'done' | 'failed';
  paper?: QuestionPaper;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionSpecSchema = new mongoose.Schema(
  { count: { type: Number, required: true }, marks: { type: Number, required: true } },
  { _id: false },
);

const inputSchema = new mongoose.Schema(
  {
    fileUrl: { type: String },
    dueDate: { type: String, required: true },
    questionTypes: { type: [String], required: true },
    questions: { type: [questionSpecSchema], required: true },
    instructions: { type: String },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'moderate', 'hard'], required: true },
    marks: { type: Number, required: true },
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
    className: { type: String },
    examDate: { type: String },
  },
  { _id: false },
);

const paperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    durationMinutes: { type: Number },
    generalInstructions: { type: String },
    studentInfo: { type: studentInfoSchema, default: {} },
    sections: { type: [sectionSchema], required: true },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema<AssignmentDocument>(
  {
    input: { type: inputSchema, required: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'failed'],
      required: true,
    },
    paper: { type: paperSchema },
    error: { type: String },
  },
  { timestamps: true },
);

export const AssignmentModel: Model<AssignmentDocument> =
  mongoose.models['Assignment'] ?? mongoose.model<AssignmentDocument>('Assignment', assignmentSchema);
