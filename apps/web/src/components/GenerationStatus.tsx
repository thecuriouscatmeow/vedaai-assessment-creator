'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import copy from '@/content/copy.json';

interface Props {
  onPrevious: () => void;
}

/**
 * GenerationStatus — step-2 of the assignment creation flow.
 *
 * Reads generation state from Redux (driven by socket events) and renders the
 * current job status: queued → processing → done | failed. On done, reveals a
 * link to the output view. On failed, shows the error + retry affordance.
 */
export function GenerationStatus({ onPrevious }: Props) {
  const { status, assignmentId, error } = useAppSelector((s) => s.generation);

  return (
    <article aria-label={copy.assignmentForm.step2.sectionTitle}>
      <header>
        <h2>{copy.assignmentForm.step2.sectionTitle}</h2>
        <p>{copy.assignmentForm.step2.sectionSubtitle}</p>
      </header>

      <div aria-live="polite" data-testid="generation-status">
        <p data-testid="generation-status-text">
          {copy.generation.status[status === 'idle' ? 'idle' : status]}
        </p>

        {status === 'done' && assignmentId && (
          <Link
            href={`/assignments/${assignmentId}`}
            data-testid="view-paper-link"
          >
            {copy.generation.viewPaper}
          </Link>
        )}

        {status === 'failed' && (
          <div role="alert" data-testid="generation-error">
            <p>{copy.generation.status.failed}</p>
            {error && <p>{error}</p>}
            <button
              type="button"
              aria-label={copy.generation.retryLabel}
              onClick={onPrevious}
            >
              {copy.generation.retry}
            </button>
          </div>
        )}
      </div>

      <button type="button" onClick={onPrevious} data-testid="previous-button">
        {copy.assignmentForm.previous}
      </button>
    </article>
  );
}
