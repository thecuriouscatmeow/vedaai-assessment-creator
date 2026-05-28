'use client';

import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetGeneration, enqueued } from '@/store/slices/generationSlice';
import { API_URL } from '@/lib/config';
import { useAssignmentSocket } from '@/lib/useAssignmentSocket';
import copy from '@/content/copy.json';

/**
 * RegenerateBar — sticky banner rendered on the output page when
 * `assignmentForm.values` is populated (i.e., the current session navigated
 * through the creation form).
 *
 * Clicking "Regenerate" resets the generation state, POSTs the same
 * AssignmentInput again, and navigates to the new assignment's output page.
 * The button is disabled while a generation is in-flight (queued/processing).
 */
export function RegenerateBar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const values = useAppSelector((s) => s.assignmentForm.values);
  const status = useAppSelector((s) => s.generation.status);
  const subscribeToAssignment = useAssignmentSocket();

  if (!values) return null;

  const isPending = status === 'queued' || status === 'processing';

  async function handleRegenerate() {
    if (isPending || !values) return;
    dispatch(resetGeneration());
    try {
      const res = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
      const { assignmentId } = (await res.json()) as { assignmentId: string };
      dispatch(enqueued({ assignmentId }));
      subscribeToAssignment(assignmentId);
      router.push(`/assignments/${assignmentId}`);
    } catch {
      // Silent failure — user can retry by clicking the button again.
    }
  }

  return (
    <div className="bg-surface border-b border-grey-2 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-10 shadow-[var(--shadow-card)]">
      <p className="text-p4 text-text-secondary">{copy.regenerate.prompt}</p>
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={isPending}
        className="bg-btn-orange text-white rounded-full px-6 py-2 text-p4 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isPending ? copy.regenerate.generating : copy.regenerate.buttonLabel}
      </button>
    </div>
  );
}
