import type { AssignmentInput } from '@vedaai/shared';
import type { AssignmentRepository } from '../adapters/db/assignment.repository';
import type { AssignmentDocument } from '../models/assignment';
import type { GenerateQueue } from '../lib/queue';

/**
 * Assignment service — business logic for the generation lifecycle.
 *
 * Depends on `AssignmentRepository` (persistence) and `GenerateQueue` (job
 * dispatch) through interfaces, so tests and future providers inject fakes
 * without touching this file.
 */

export interface AssignmentServiceDeps {
  repo: AssignmentRepository;
  queue: GenerateQueue;
}

export interface AssignmentService {
  create(input: AssignmentInput): Promise<{ assignmentId: string }>;
  findById(id: string): Promise<AssignmentDocument | null>;
}

export function createAssignmentService({ repo, queue }: AssignmentServiceDeps): AssignmentService {
  return {
    async create(input) {
      const { id: assignmentId } = await repo.create(input);
      await queue.enqueue({ assignmentId, input });
      return { assignmentId };
    },

    async findById(id) {
      return repo.findById(id);
    },
  };
}
