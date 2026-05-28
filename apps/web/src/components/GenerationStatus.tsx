'use client';

import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import copy from '@/content/copy.json';

interface Props {
  onPrevious: () => void;
}

/** Maps each generation status to a progress-bar percentage (0–100). */
const STATUS_PROGRESS: Record<string, number> = {
  idle: 0,
  queued: 25,
  processing: 60,
  done: 100,
  failed: 100,
};

/**
 * GenerationStatus — step-2 of the assignment creation flow.
 *
 * Reads generation state from Redux (driven by socket events) and renders the
 * current job status: queued → processing → done | failed. On done, reveals a
 * link to the output view. On failed, shows the error + retry affordance.
 */
export function GenerationStatus({ onPrevious }: Props) {
  const { status, assignmentId, error } = useAppSelector((s) => s.generation);

  const progressPct = STATUS_PROGRESS[status] ?? 0;

  return (
    <article
      aria-label={copy.assignmentForm.step2.sectionTitle}
      className="
        max-w-[640px] mx-auto mt-[clamp(2rem,5dvh,4rem)]
        bg-surface rounded-[24px] shadow-[var(--shadow-modal)]
        p-8 sm:p-10
        flex flex-col items-center gap-6 text-center
      "
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-bold text-p2 text-text-primary">
          {copy.assignmentForm.step2.sectionTitle}
        </h2>
        <p className="text-p4 text-text-secondary">
          {copy.assignmentForm.step2.sectionSubtitle}
        </p>
      </header>

      <div aria-live="polite" data-testid="generation-status" className="w-full flex flex-col items-center gap-4">
        <p
          data-testid="generation-status-text"
          className="text-p3 font-medium text-text-primary"
        >
          {copy.generation.status[status === 'idle' ? 'idle' : status]}
        </p>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Generation progress"
          className="w-full bg-surface-hover rounded-full h-2"
        >
          <div
            className="bg-btn-dark rounded-full h-2 transition-all duration-300"
            style={{ width: `${String(progressPct)}%` }}
          />
        </div>

        {status === 'done' && assignmentId && (
          <Link
            href={`/assignments/${assignmentId}`}
            data-testid="view-paper-link"
            className="
              bg-btn-orange text-white rounded-full px-6 py-3
              text-p3 font-medium transition-opacity hover:opacity-90
            "
          >
            {copy.generation.viewPaper}
          </Link>
        )}

        {status === 'failed' && (
          <div
            role="alert"
            data-testid="generation-error"
            className="flex flex-col items-center gap-3"
          >
            <p className="text-p3 text-error">{copy.generation.status.failed}</p>
            {error && <p className="text-p4 text-text-secondary">{error}</p>}
            <button
              type="button"
              aria-label={copy.generation.retryLabel}
              onClick={onPrevious}
              className="
                bg-btn-dark text-white rounded-full px-6 py-3
                text-p3 font-medium transition-opacity hover:opacity-90
              "
            >
              {copy.generation.retry}
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onPrevious}
        data-testid="previous-button"
        className="text-p4 text-text-secondary underline hover:text-text-primary transition-colors"
      >
        {copy.assignmentForm.previous}
      </button>
    </article>
  );
}
