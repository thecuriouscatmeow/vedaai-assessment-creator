import { Router } from 'express';
import { z } from 'zod';
import type { Logger } from 'pino';
import {
  AssignmentInputSchema,
  AssignmentSummarySchema,
  AssignmentStatusSchema,
  QuestionPaperSchema,
  type AssignmentInput,
} from '@vedaai/shared';
import type { AssignmentService } from '../services/assignment.service';
import { validateBody } from '../middleware/validate-body';
import { sanitizeBody } from '../middleware/sanitize';
import { validateOutput } from '../middleware/validate-output';
import { requireObjectId } from '../middleware/validate-params';
import { asyncHandler } from '../lib/async-handler';

export interface AssignmentRouterDeps {
  assignmentService: AssignmentService;
  logger: Logger;
}

const CreateResponseSchema = z.object({ assignmentId: z.string() });

const AssignmentDetailSchema = z.object({
  assignmentId: z.string(),
  status: AssignmentStatusSchema,
  title: z.string().nullable(),
  input: AssignmentInputSchema,
  paper: QuestionPaperSchema.nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export function createAssignmentRouter({
  assignmentService,
  logger,
}: AssignmentRouterDeps): Router {
  const router = Router();

  const listHandler = asyncHandler(async (_req, res) => {
    const summaries = await assignmentService.listAll();
    logger.info({ count: summaries.length }, 'route: listed assignments');
    res.status(200).json(summaries);
  });

  const createHandler = asyncHandler(async (req, res) => {
    const { assignmentId } = await assignmentService.create(req.validBody as AssignmentInput);
    logger.info({ assignmentId }, 'route: assignment created');
    res.status(201).json({ assignmentId });
  });

  const getByIdHandler = asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    const assignment = await assignmentService.findById(id);
    if (!assignment) {
      res.status(404).json({ error: { status: 404, message: `Assignment ${id} not found` } });
      return;
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
  });

  const deleteHandler = asyncHandler(async (req, res) => {
    const id = req.params['id'] as string;
    await assignmentService.deleteById(id);
    logger.info({ id }, 'route: assignment deleted');
    res.status(204).send();
  });

  router.get('/', validateOutput(z.array(AssignmentSummarySchema)), listHandler);
  router.post('/', sanitizeBody(), validateBody(AssignmentInputSchema), validateOutput(CreateResponseSchema), createHandler);
  router.get('/:id', requireObjectId('id'), validateOutput(AssignmentDetailSchema), getByIdHandler);
  router.delete('/:id', requireObjectId('id'), deleteHandler);

  return router;
}
