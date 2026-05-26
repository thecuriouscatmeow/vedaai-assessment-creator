import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { QueueEvents } from 'bullmq';
import type { Redis as IORedis } from 'ioredis';
import type { Logger } from 'pino';
import {
  AssignmentDoneSchema,
  AssignmentFailedSchema,
  AssignmentSubscribeSchema,
  SOCKET_CLIENT_EVENTS,
  SOCKET_EVENTS,
} from '@vedaai/shared';
import { GENERATE_QUEUE } from './queue';

/**
 * Stable room name for an assignment.
 *
 * Single-sourced here so both the subscription handler and the QueueEvents
 * emitter use the same string without risk of a typo divergence.
 */
export function roomFor(assignmentId: string): string {
  return `assignment:${assignmentId}`;
}

export interface SocketServerOptions {
  logger: Logger;
  corsOrigin: string;
}

/**
 * Attaches a Socket.IO server to an existing Node http server.
 *
 * Responsibilities:
 * - Configure CORS for the web origin.
 * - On `connection`: log the connected socket; register the
 *   `SOCKET_CLIENT_EVENTS.subscribe` handler that validates the payload and
 *   joins the client to the correct room.
 *
 * The returned `SocketIOServer` is used by `server.ts` to emit results via
 * `attachGenerateQueueEvents` and to close cleanly on shutdown.
 */
export function createSocketServer(
  httpServer: HttpServer,
  { logger, corsOrigin }: SocketServerOptions,
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'socket: client connected');

    socket.on(SOCKET_CLIENT_EVENTS.subscribe, (payload: unknown) => {
      const result = AssignmentSubscribeSchema.safeParse(payload);
      if (!result.success) {
        logger.warn(
          { socketId: socket.id, issues: result.error.issues },
          'socket: invalid subscribe payload — ignoring',
        );
        return;
      }

      const { assignmentId } = result.data;
      const room = roomFor(assignmentId);
      void socket.join(room);
      logger.info({ socketId: socket.id, assignmentId, room }, 'socket: client joined room');
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'socket: client disconnected');
    });
  });

  return io;
}

export interface QueueEventsOptions {
  connection: IORedis;
  logger: Logger;
}

/**
 * Attaches a BullMQ `QueueEvents` listener to the `generate` queue.
 *
 * When a job completes the API process — which holds the Socket.IO server —
 * pushes the result to the room directly. The worker never touches sockets.
 *
 * `returnvalue` from BullMQ QueueEvents may arrive as a JSON-stringified
 * string (BullMQ serialises job return values). We handle both cases
 * defensively: attempt `JSON.parse` when the value is a string, then validate
 * through `AssignmentDoneSchema`. Invalid payloads are logged and skipped
 * rather than crashing the process.
 *
 * Returns the `QueueEvents` instance so `server.ts` can close it on shutdown.
 */
export function attachGenerateQueueEvents(
  io: SocketIOServer,
  { connection, logger }: QueueEventsOptions,
): QueueEvents {
  const queueEvents = new QueueEvents(GENERATE_QUEUE, { connection });

  queueEvents.on('completed', ({ jobId, returnvalue }) => {
    let parsed: unknown;
    try {
      parsed = typeof returnvalue === 'string' ? (JSON.parse(returnvalue) as unknown) : returnvalue;
    } catch (err) {
      logger.error({ jobId, err }, 'queueEvents: failed to parse returnvalue — skipping emit');
      return;
    }

    const doneResult = AssignmentDoneSchema.safeParse({
      assignmentId: jobId,
      paper: parsed,
    });

    if (!doneResult.success) {
      logger.error(
        { jobId, issues: doneResult.error.issues },
        'queueEvents: returnvalue failed AssignmentDoneSchema validation — skipping emit',
      );
      return;
    }

    const room = roomFor(jobId);
    io.to(room).emit(SOCKET_EVENTS.done, doneResult.data);
    logger.info({ jobId, room }, 'queueEvents: emitted assignment:done');
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    const failedResult = AssignmentFailedSchema.safeParse({
      assignmentId: jobId,
      error: failedReason ?? 'unknown error',
    });

    if (!failedResult.success) {
      logger.error(
        { jobId, issues: failedResult.error.issues },
        'queueEvents: failed payload validation error — skipping emit',
      );
      return;
    }

    const room = roomFor(jobId);
    io.to(room).emit(SOCKET_EVENTS.failed, failedResult.data);
    logger.error({ jobId, room, failedReason }, 'queueEvents: emitted assignment:failed');
  });

  logger.info({ queue: GENERATE_QUEUE }, 'queueEvents: listener attached');
  return queueEvents;
}
