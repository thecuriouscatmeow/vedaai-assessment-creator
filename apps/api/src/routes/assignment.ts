import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import type { Logger } from 'pino';
import { AssignmentInputSchema } from '@vedaai/shared';
import type { AssignmentService } from '../services/assignment.service';
import { HttpError, NotFoundError } from '../lib/error';

/**
 * Assignment router.
 *
 * GET    /api/assignments       → AssignmentSummary[] (newest first)
 * POST   /api/assignments       → validate → persist queued → enqueue → 201 { assignmentId }
 * GET    /api/assignments/:id   → full assignment record; 404 if missing
 * DELETE /api/assignments/:id   → delete; 204 on success; 404 if missing
 *
 * Validation failures return a structured Zod error envelope so the frontend
 * can surface field-level messages without additional parsing.
 */

export interface AssignmentRouterDeps {
  assignmentService: AssignmentService;
  logger: Logger;
}

/** Guard: rejects non-ObjectId ids before hitting Mongoose. */
function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(400, 'Invalid assignment id format');
  }
}

export function createAssignmentRouter({
  assignmentService,
  logger,
}: AssignmentRouterDeps): Router {
  const router = Router();

  // GET /api/assignments — list
  const listHandler = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const summaries = await assignmentService.listAll();
      logger.info({ count: summaries.length }, 'route: listed assignments');
      res.status(200).json(summaries);
    } catch (err) {
      next(err);
    }
  };

  // POST /api/assignments — create
  const createHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = AssignmentInputSchema.safeParse(req.body);
      if (!parsed.success) {
        logger.warn({ issues: parsed.error.issues }, 'route: assignment input validation failed');
        res.status(400).json({
          error: {
            status: 400,
            message: 'Validation failed',
            issues: parsed.error.issues,
          },
        });
        return;
      }

      const { assignmentId } = await assignmentService.create(parsed.data);
      logger.info({ assignmentId }, 'route: assignment created');
      res.status(201).json({ assignmentId });
    } catch (err) {
      next(err);
    }
  };

  // GET /api/assignments/:id — get by id
  const getByIdHandler = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      assertObjectId(id);

      const assignment = await assignmentService.findById(id);
      if (!assignment) {
        throw new HttpError(404, `Assignment ${id} not found`);
      }

      res.status(200).json({
        assignmentId: assignment.id,
        status: assignment.status,
        title: assignment.title ?? null,
        input: assignment.input,
        paper: assignment.paper ?? null,
        error: assignment.error ?? null,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  };

  // DELETE /api/assignments/:id
  const deleteHandler = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      assertObjectId(id);

      await assignmentService.deleteById(id);
      logger.info({ id }, 'route: assignment deleted');
      res.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) {
        next(new HttpError(404, err.message));
        return;
      }
      next(err);
    }
  };

  router.get('/', listHandler);
  router.post('/', createHandler);
  router.get('/:id', getByIdHandler);
  router.delete('/:id', deleteHandler);

  return router;
}
