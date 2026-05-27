import { Router, type Request, type Response, type NextFunction } from 'express';
import mongoose from 'mongoose';
import { AssignmentInputSchema } from '@vedaai/shared';
import type { AssignmentService } from '../services/assignment.service';
import { HttpError } from '../lib/error';

/**
 * Assignment router.
 *
 * POST /api/assignments — validate input, persist, enqueue, return 201 + assignmentId.
 * GET  /api/assignments/:id — return stored assignment; 404 if not found.
 *
 * Validation failures return a structured Zod error envelope so the frontend
 * can surface field-level messages without any additional parsing.
 */

export interface AssignmentRouterDeps {
  assignmentService: AssignmentService;
}

export function createAssignmentRouter({ assignmentService }: AssignmentRouterDeps): Router {
  const router = Router();

  const createHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = AssignmentInputSchema.safeParse(req.body);
      if (!parsed.success) {
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
      res.status(201).json({ assignmentId });
    } catch (err) {
      next(err);
    }
  };

  const getByIdHandler = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new HttpError(400, 'Missing assignment id');
      }

      // Guard against malformed ObjectIds to avoid Mongoose CastError noise
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new HttpError(400, 'Invalid assignment id format');
      }

      const assignment = await assignmentService.findById(id);
      if (!assignment) {
        throw new HttpError(404, `Assignment ${id} not found`);
      }

      res.status(200).json({
        assignmentId: String(assignment._id),
        status: assignment.status,
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

  router.post('/', createHandler);
  router.get('/:id', getByIdHandler);

  return router;
}
