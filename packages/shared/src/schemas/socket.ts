import { z } from 'zod';
import { QuestionPaperSchema } from './question-paper';

/**
 * Socket.IO event contract for the generation lifecycle.
 *
 * The worker emits these to the requesting client room as a job moves
 * queued → processing → done | failed.
 */

export const AssignmentStatusSchema = z.enum(['queued', 'processing', 'done', 'failed']);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

export const SOCKET_EVENTS = {
  queued: 'assignment:queued',
  progress: 'assignment:progress',
  done: 'assignment:done',
  failed: 'assignment:failed',
} as const;
export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export const AssignmentQueuedSchema = z.object({
  assignmentId: z.string().min(1),
  status: z.literal('queued'),
});
export type AssignmentQueued = z.infer<typeof AssignmentQueuedSchema>;

export const AssignmentProgressSchema = z.object({
  assignmentId: z.string().min(1),
  stage: z.string().min(1),
  percent: z.number().min(0).max(100),
});
export type AssignmentProgress = z.infer<typeof AssignmentProgressSchema>;

export const AssignmentDoneSchema = z.object({
  assignmentId: z.string().min(1),
  paper: QuestionPaperSchema,
});
export type AssignmentDone = z.infer<typeof AssignmentDoneSchema>;

export const AssignmentFailedSchema = z.object({
  assignmentId: z.string().min(1),
  error: z.string().min(1),
});
export type AssignmentFailed = z.infer<typeof AssignmentFailedSchema>;
