import type { AssignmentInput, AssignmentSummary, QuestionPaper } from '@vedaai/shared';
import { AssignmentModel, type AssignmentRecord } from '../../models/assignment';
import { NotFoundError } from '../../lib/error';

/**
 * Repository contract for assignment persistence.
 *
 * The service layer depends only on this interface — Mongoose never leaks past
 * this boundary. All methods return plain `AssignmentRecord` domain objects
 * (via `.lean()` + mapper) so no Mongoose Document ever escapes to callers.
 * Tests inject a fake; a real Postgres swap touches only this file.
 */
export interface AssignmentRepository {
  /** Persist a new queued assignment; returns its generated id. */
  create(input: AssignmentInput): Promise<{ id: string }>;
  /** Return full record or null when not found. */
  findById(id: string): Promise<AssignmentRecord | null>;
  /** Return a summary list sorted newest first. */
  listAll(): Promise<AssignmentSummary[]>;
  /** Delete by id; throws if not found. */
  deleteById(id: string): Promise<void>;
  /** Transition to processing. Throws if id not found. */
  setProcessing(id: string): Promise<void>;
  /** Persist paper + title, transition to done. Throws if id not found. */
  setDone(id: string, paper: QuestionPaper, title: string): Promise<void>;
  /** Persist error message, transition to failed. Throws if id not found. */
  setFailed(id: string, error: string): Promise<void>;
}

// ─── Lean document shape (Mongoose .lean() output) ───────────────────────────

interface LeanDoc {
  _id: { toString(): string };
  input: AssignmentInput;
  status: AssignmentRecord['status'];
  title?: string;
  paper?: QuestionPaper;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

function toRecord(doc: LeanDoc): AssignmentRecord {
  return {
    id: doc._id.toString(),
    input: doc.input,
    status: doc.status,
    title: doc.title,
    paper: doc.paper,
    error: doc.error,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Mongoose-backed implementation of {@link AssignmentRepository}.
 *
 * This is the only file that imports `AssignmentModel` directly; all other
 * layers go through the interface.
 */
export function createAssignmentRepository(): AssignmentRepository {
  return {
    async create(input) {
      const doc = await AssignmentModel.create({ input, status: 'queued' });
      return { id: String(doc._id) };
    },

    async findById(id) {
      const doc = await AssignmentModel.findById(id).lean<LeanDoc>().exec();
      if (!doc) return null;
      return toRecord(doc);
    },

    async listAll() {
      const docs = await AssignmentModel.find({})
        .sort({ createdAt: -1 })
        .lean<LeanDoc[]>()
        .exec();

      return docs.map((doc): AssignmentSummary => ({
        id: doc._id.toString(),
        title: doc.title ?? 'Untitled assignment',
        status: doc.status,
        assignedAt: doc.createdAt.toISOString(),
        dueDate: doc.input.dueDate,
      }));
    },

    async deleteById(id) {
      const result = await AssignmentModel.findByIdAndDelete(id).lean().exec();
      if (!result) {
        throw new NotFoundError(`Assignment ${id} not found`);
      }
    },

    async setProcessing(id) {
      const result = await AssignmentModel.findByIdAndUpdate(
        id,
        { status: 'processing' },
        { new: true },
      )
        .lean()
        .exec();
      if (!result) {
        throw new NotFoundError(`Assignment ${id} not found`);
      }
    },

    async setDone(id, paper, title) {
      const result = await AssignmentModel.findByIdAndUpdate(
        id,
        { status: 'done', paper, title },
        { new: true },
      )
        .lean()
        .exec();
      if (!result) {
        throw new NotFoundError(`Assignment ${id} not found`);
      }
    },

    async setFailed(id, error) {
      const result = await AssignmentModel.findByIdAndUpdate(
        id,
        { status: 'failed', error },
        { new: true },
      )
        .lean()
        .exec();
      if (!result) {
        throw new NotFoundError(`Assignment ${id} not found`);
      }
    },
  };
}
