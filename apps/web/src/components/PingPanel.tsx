'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { AssignmentDone, AssignmentFailed, QuestionPaper } from '@vedaai/shared';
import { AssignmentQueuedSchema, SOCKET_CLIENT_EVENTS, SOCKET_EVENTS } from '@vedaai/shared';
import { API_URL } from '@/lib/config';
import copy from '@/content/copy.json';

type Status = 'idle' | 'queued' | 'done' | 'failed';

/**
 * PingPanel — walking-skeleton Socket.IO round-trip component.
 *
 * Clicking the button:
 *   1. POSTs to /api/ping → receives { assignmentId }.
 *   2. Opens a socket to the API, emits assignment:subscribe.
 *   3. Listens for assignment:done and renders the QuestionPaper.
 *
 * State is kept local (useState). A Redux generation slice belongs in Phase 3.
 * No console.* — errors surface in the status line.
 */
export function PingPanel() {
  const [status, setStatus] = useState<Status>('idle');
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  function cleanupSocket() {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }

  async function handlePing() {
    cleanupSocket();
    setPaper(null);
    setErrorMsg('');
    setStatus('queued');

    let assignmentId: string;

    try {
      const response = await fetch(`${API_URL}/api/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${String(response.status)}`);
      }

      const data = AssignmentQueuedSchema.parse(await response.json());
      assignmentId = data.assignmentId;
    } catch (err) {
      setStatus('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Ping request failed');
      return;
    }

    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit(SOCKET_CLIENT_EVENTS.subscribe, { assignmentId });
    });

    socket.on(SOCKET_EVENTS.done, (payload: AssignmentDone) => {
      setPaper(payload.paper);
      setStatus('done');
      cleanupSocket();
    });

    socket.on(SOCKET_EVENTS.failed, (payload: AssignmentFailed) => {
      setStatus('failed');
      setErrorMsg(payload.error);
      cleanupSocket();
    });

    socket.on('connect_error', (err: Error) => {
      setStatus('failed');
      setErrorMsg(`Socket connection error: ${err.message}`);
      cleanupSocket();
    });
  }

  const statusLabel =
    status === 'failed' && errorMsg
      ? `${copy.ping.status.failed} ${errorMsg}`
      : copy.ping.status[status];

  return (
    <section className="flex w-full max-w-2xl flex-col gap-6 rounded-lg border border-muted/20 p-8">
      <h2 className="text-2xl font-semibold text-heading">{copy.ping.heading}</h2>

      <p className="text-sm text-muted">{statusLabel}</p>

      <button
        onClick={() => void handlePing()}
        disabled={status === 'queued'}
        className="self-start rounded-md bg-heading px-5 py-2.5 text-sm font-medium text-body transition-opacity disabled:opacity-50"
      >
        {copy.ping.button}
      </button>

      {paper && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-heading">{paper.title}</h3>
            <p className="text-sm text-muted">
              {paper.subject} &middot; {paper.totalMarks} marks
            </p>
          </div>

          {paper.sections.map((section, si) => (
            <div key={si} className="flex flex-col gap-3">
              <h4 className="font-medium text-heading">{section.title}</h4>
              {section.instruction && (
                <p className="text-sm italic text-muted">{section.instruction}</p>
              )}
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                {section.questions.map((q, qi) => (
                  <li key={qi} className="text-sm text-heading">
                    {q.text}
                    <span className="ml-2 text-xs text-muted">
                      [{q.difficulty} &middot; {q.marks}m]
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
