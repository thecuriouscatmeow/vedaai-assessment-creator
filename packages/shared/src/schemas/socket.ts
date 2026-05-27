import { z } from 'zod';
import { QuestionPaperSchema } from './question-paper';

/**
 * Socket.IO event contract for the generation lifecycle.
 *
 * The worker emits these to the requesting client room as a job moves
 * queued → processing → done | failed. The `AssignmentStatus` enum lives in
 * `./assignment` (re-exported from the package root) as it is an assignment
 * concept shared by the REST and socket layers.
 */

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

/**
 * Client → server events.
 *
 * The client emits `assignment:subscribe` with an `assignmentId` immediately
 * after connecting so the server can join it to the correct room. This is the
 * only client-originated event in the generation lifecycle.
 */
export const SOCKET_CLIENT_EVENTS = {
  subscribe: 'assignment:subscribe',
} as const;
export type SocketClientEventName = (typeof SOCKET_CLIENT_EVENTS)[keyof typeof SOCKET_CLIENT_EVENTS];

export const AssignmentSubscribeSchema = z.object({
  assignmentId: z.string().min(1),
});
export type AssignmentSubscribe = z.infer<typeof AssignmentSubscribeSchema>;
