import type { Logger } from 'pino';
import type { AssignmentInput, AssignmentSummary } from '@vedaai/shared';
import type { AssignmentRepository } from '../adapters/db/assignment.repository';
import type { AssignmentRecord } from '../models/assignment';
import type { GenerateQueue } from '../lib/queue';

/**
 * Assignment service — business logic for the generation lifecycle.
 *
 * Depends on `AssignmentRepository` (persistence), `GenerateQueue` (job
 * dispatch), and a pino `logger` through interfaces, so tests and future
 * providers inject fakes without touching this file.
 */

export interface AssignmentServiceDeps {
  repo: AssignmentRepository;
  queue: GenerateQueue;
  logger: Logger;
}

export interface AssignmentService {
  create(input: AssignmentInput): Promise<{ assignmentId: string }>;
  findById(id: string): Promise<AssignmentRecord | null>;
  listAll(): Promise<AssignmentSummary[]>;
  deleteById(id: string): Promise<void>;
}

export function createAssignmentService({
  repo,
  queue,
  logger,
}: AssignmentServiceDeps): AssignmentService {
  return {
    async create(input) {
      const { id: assignmentId } = await repo.create(input);
      logger.info({ assignmentId }, 'assignment: created, enqueueing');

      try {
        await queue.enqueue({ assignmentId, input });
      } catch (err) {
        // Enqueue failed — mark the record failed so it never stays orphaned.
        await repo.setFailed(assignmentId, err instanceof Error ? err.message : String(err));
        logger.error({ assignmentId, err }, 'assignment: enqueue failed; marked failed');
        throw err;
      }

      logger.info({ assignmentId }, 'assignment: enqueued');
      return { assignmentId };
    },

    async findById(id) {
      const record = await repo.findById(id);
      if (!record) {
        logger.warn({ id }, 'assignment: findById — not found');
      }
      return record;
    },

    async listAll() {
      const list = await repo.listAll();
      logger.info({ count: list.length }, 'assignment: listAll');
      return list;
    },

    async deleteById(id) {
      await repo.deleteById(id);
      logger.info({ id }, 'assignment: deleted');
    },
  };
}
