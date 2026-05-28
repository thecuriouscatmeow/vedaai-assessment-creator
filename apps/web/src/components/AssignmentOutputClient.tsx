'use client';

import { useEffect, useState } from 'react';
import type { QuestionPaper } from '@vedaai/shared';
import { QuestionPaperView } from './QuestionPaperView';
import { RegenerateBar } from './RegenerateBar';
import { API_URL } from '@/lib/config';
import copy from '@/content/copy.json';

interface Props {
  assignmentId: string;
}

type FetchState =
  | { phase: 'loading' }
  | { phase: 'done'; paper: QuestionPaper }
  | { phase: 'failed'; message: string };

/**
 * AssignmentOutputClient — client shell that fetches a completed assignment
 * from GET /api/assignments/:id and delegates rendering to QuestionPaperView.
 *
 * Lifecycle states:
 *  - loading: show placeholder
 *  - done: render QuestionPaperView
 *  - failed: show error message
 */
export function AssignmentOutputClient({ assignmentId }: Props) {
  const [state, setState] = useState<FetchState>({ phase: 'loading' });

  useEffect(() => {
    setState({ phase: 'loading' });

    fetch(`${API_URL}/api/assignments/${assignmentId}`)
      .then(async (res) => {
        if (!res.ok) {
          setState({ phase: 'failed', message: `HTTP ${String(res.status)}` });
          return;
        }
        const data = (await res.json()) as { paper: QuestionPaper };
        setState({ phase: 'done', paper: data.paper });
      })
      .catch(() => {
        setState({ phase: 'failed', message: copy.output.fetchError });
      });
  }, [assignmentId]);

  if (state.phase === 'failed') {
    return (
      <p role="alert" data-testid="output-error">
        {copy.output.failed} {state.message}
      </p>
    );
  }

  if (state.phase === 'done') {
    return (
      <>
        {/* Regenerate bar — only shown when form values are available */}
        <RegenerateBar />
        <QuestionPaperView paper={state.paper} />
      </>
    );
  }

  return (
    <p aria-live="polite" data-testid="output-loading">
      {copy.output.loading}
    </p>
  );
}
