'use client';

import { useCallback, useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { AssignmentDone, AssignmentFailed } from '@vedaai/shared';
import { SOCKET_CLIENT_EVENTS, SOCKET_EVENTS } from '@vedaai/shared';
import { useAppDispatch } from '@/store/hooks';
import { succeeded, failed, processing } from '@/store/slices/generationSlice';
import { API_URL } from './config';
import copy from '@/content/copy.json';

/**
 * useAssignmentSocket — reusable socket hook for the generation lifecycle.
 *
 * Returns a `subscribe` callback. Call it with an assignmentId immediately
 * after enqueuing a job. The hook opens a Socket.IO connection, joins the
 * assignment room, and dispatches Redux actions as events arrive.
 *
 * The socket is disconnected automatically when the consuming component
 * unmounts, and also disconnected after done/failed to free resources.
 */
export function useAssignmentSocket(): (assignmentId: string) => void {
  const dispatch = useAppDispatch();
  const socketRef = useRef<Socket | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const subscribe = useCallback(
    (assignmentId: string) => {
      // Disconnect any existing socket before opening a new subscription
      socketRef.current?.disconnect();

      const socket = io(API_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      // Tracks whether a terminal event (done/failed) already settled this run,
      // so the intentional disconnect below isn't reported as a failure.
      let settled = false;
      const teardown = () => {
        socket.disconnect();
        socketRef.current = null;
      };

      socket.on('connect', () => {
        socket.emit(SOCKET_CLIENT_EVENTS.subscribe, { assignmentId });
      });

      socket.on('connect_error', () => {
        if (settled) return;
        settled = true;
        dispatch(failed({ error: copy.assignmentForm.errors.connectionError }));
        teardown();
      });

      socket.on('disconnect', () => {
        // Only surface unexpected disconnects (not the teardown after done/failed).
        if (settled) return;
        settled = true;
        dispatch(failed({ error: copy.assignmentForm.errors.connectionError }));
        socketRef.current = null;
      });

      socket.on(SOCKET_EVENTS.queued, () => {
        // Already dispatched enqueued in the submit handler; no re-dispatch needed
      });

      socket.on(SOCKET_EVENTS.progress, () => {
        dispatch(processing());
      });

      socket.on(SOCKET_EVENTS.done, (payload: AssignmentDone) => {
        settled = true;
        dispatch(succeeded({ paper: payload.paper }));
        teardown();
      });

      socket.on(SOCKET_EVENTS.failed, (payload: AssignmentFailed) => {
        settled = true;
        dispatch(failed({ error: payload.error }));
        teardown();
      });
    },
    [dispatch],
  );

  return subscribe;
}
