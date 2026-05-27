import type { AssignmentInput, QuestionPaper } from '@vedaai/shared';
import { AssignmentModel, type AssignmentDocument } from '../../models/assignment';


/**
 * Repository contract for assignment persistence.
 *
 * Service layer depends only on this interface — Mongoose never leaks past
 * this boundary. Tests inject a fake; a real Postgres swap touches only this
 * file and the implementation below.
 */
export interface AssignmentRepository {
  create(input: AssignmentInput): Promise<{ id: string }>;
  findById(id: string): Promise<AssignmentDocument | null>;
  setProcessing(id: string): Promise<void>;
  setDone(id: string, paper: QuestionPaper): Promise<void>;
  setFailed(id: string, error: string): Promise<void>;
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
      // exec() with lean returns a plain object; cast through unknown to satisfy
      // the interface while keeping the concrete type usable downstream.
      return AssignmentModel.findById(id).exec() as Promise<AssignmentDocument | null>;
    },

    async setProcessing(id) {
      await AssignmentModel.findByIdAndUpdate(id, { status: 'processing' });
    },

    async setDone(id, paper) {
      await AssignmentModel.findByIdAndUpdate(id, { status: 'done', paper });
    },

    async setFailed(id, error) {
      await AssignmentModel.findByIdAndUpdate(id, { status: 'failed', error });
    },
  };
}
