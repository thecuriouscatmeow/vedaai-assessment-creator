import { createServer } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type Socket as ClientSocket, io as ioClient } from 'socket.io-client';
import { type Server as SocketIOServer } from 'socket.io';
import {
  AssignmentDoneSchema,
  SOCKET_CLIENT_EVENTS,
  SOCKET_EVENTS,
} from '@vedaai/shared';
import { createSocketServer, roomFor } from './socket';
import { createLogger } from './logger';
import { loadConfig } from './config';

/**
 * Integration tests for the Socket.IO server + room round-trip.
 *
 * No Redis or BullMQ involved — we test only that:
 *   1. A client can connect and emit `assignment:subscribe` to join a room.
 *   2. The server emitting to that room delivers a validated `AssignmentDone`
 *      payload to the client.
 *   3. `roomFor` produces a stable room string.
 *
 * The test uses a real http server on an ephemeral port (port 0).
 */

const validEnv = {
  NODE_ENV: 'test',
  PORT: '4100',
  MONGODB_URI: 'mongodb://localhost:27017/veda',
  REDIS_URL: 'redis://localhost:6379',
  GEMINI_API_KEY: 'gem-key',
  CLOUDINARY_CLOUD_NAME: 'demo',
  CLOUDINARY_API_KEY: 'cl-key',
  CLOUDINARY_API_SECRET: 'cl-secret',
} as const;

const validPaper = {
  title: 'Test Paper',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Mathematics',
  className: 'Class 8',
  totalMarks: 50,
  studentInfo: {},
  sections: [
    {
      title: 'Section A',
      questions: [{ text: 'What is 2 + 2?', difficulty: 'easy' as const, marks: 5 }],
    },
  ],
};

describe('roomFor', () => {
  it('returns a stable namespaced room string', () => {
    expect(roomFor('abc-123')).toBe('assignment:abc-123');
  });

  it('produces distinct rooms for distinct ids', () => {
    expect(roomFor('id-1')).not.toBe(roomFor('id-2'));
  });
});

describe('createSocketServer + room round-trip', () => {
  let httpServer: ReturnType<typeof createServer>;
  let io: SocketIOServer;
  let client: ClientSocket;
  let port: number;

  beforeEach(
    () =>
      new Promise<void>((resolve) => {
        const config = loadConfig(validEnv);
        const logger = createLogger({ ...config, logLevel: 'silent' });

        httpServer = createServer();
        io = createSocketServer(httpServer, {
          logger,
          corsOrigin: config.webOrigin,
        });

        httpServer.listen(0, () => {
          const addr = httpServer.address();
          port = typeof addr === 'object' && addr ? addr.port : 0;
          resolve();
        });
      }),
  );

  afterEach(
    () =>
      new Promise<void>((resolve) => {
        client?.disconnect();
        io.close(() => {
          httpServer.close(() => resolve());
        });
      }),
  );

  it('delivers an AssignmentDone payload to a subscribed client room', () =>
    new Promise<void>((resolve, reject) => {
      const assignmentId = 'test-assign-001';

      client = ioClient(`http://localhost:${port}`, { forceNew: true });

      client.on('connect', () => {
        client.emit(SOCKET_CLIENT_EVENTS.subscribe, { assignmentId });

        // Wait a tick so the server processes the join before emitting
        setTimeout(() => {
          const payload = { assignmentId, paper: validPaper };
          io.to(roomFor(assignmentId)).emit(SOCKET_EVENTS.done, payload);
        }, 50);
      });

      client.on(SOCKET_EVENTS.done, (payload: unknown) => {
        try {
          const parsed = AssignmentDoneSchema.parse(payload);
          expect(parsed.assignmentId).toBe(assignmentId);
          expect(parsed.paper.title).toBe('Test Paper');
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      client.on('connect_error', reject);

      setTimeout(() => reject(new Error('Timed out waiting for assignment:done')), 8000);
    }));

  it('ignores an invalid subscribe payload (empty assignmentId) without throwing', () =>
    new Promise<void>((resolve, reject) => {
      client = ioClient(`http://localhost:${port}`, { forceNew: true });

      client.on('connect', () => {
        // Emit with an empty assignmentId — server should silently ignore
        client.emit(SOCKET_CLIENT_EVENTS.subscribe, { assignmentId: '' });

        // If the server throws/crashes we'd get a disconnect; give it a moment
        setTimeout(resolve, 200);
      });

      client.on('disconnect', () => reject(new Error('Server disconnected client unexpectedly')));
      client.on('connect_error', reject);
    }));
});
