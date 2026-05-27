'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AssignmentSummary } from '@vedaai/shared';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchStart,
  fetchSuccess,
  fetchFailure,
  removeItem,
} from '@/store/slices/assignmentsSlice';
import { API_URL } from '@/lib/config';
import copy from '@/content/copy.json';

/**
 * AssignmentsList — the Assignments list screen.
 *
 * Fetches GET /api/assignments → AssignmentSummary[] on mount.
 * Empty state: illustration + "Create Your First Assignment" CTA.
 * Filled state: two-column scrollable grid of cards with kebab (⋮) menu.
 *   - View Assignment → /assignments/[id]
 *   - Delete → DELETE /api/assignments/:id → refresh list
 */
export function AssignmentsList() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.assignments);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchStart());
    fetch(`${API_URL}/api/assignments`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
        const data = (await res.json()) as AssignmentSummary[];
        dispatch(fetchSuccess(data));
      })
      .catch((err: unknown) => {
        dispatch(fetchFailure(err instanceof Error ? err.message : 'Fetch failed'));
      });
  }, [dispatch]);

  async function handleDelete(id: string) {
    setOpenMenuId(null);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${String(res.status)}`);
      dispatch(removeItem(id));
    } catch {
      setDeleteError(copy.assignmentsList.deleteError);
    }
  }

  function formatDate(iso: string): string {
    // iso is YYYY-MM-DD; display as DD-MM-YYYY
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]!}-${parts[1]!}-${parts[0]!}`;
  }

  function formatDateTime(iso: string): string {
    // iso is ISO datetime; extract date portion
    return formatDate(iso.slice(0, 10));
  }

  if (loading) {
    return (
      <p aria-live="polite" data-testid="assignments-loading">
        {copy.output.loading}
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" data-testid="assignments-error">
        {error}
      </p>
    );
  }

  return (
    <section aria-label={copy.assignmentsList.heading}>
      <header>
        <h1>{copy.assignmentsList.heading}</h1>
        <p>{copy.assignmentsList.subheading}</p>
      </header>

      {deleteError && (
        <p role="alert" data-testid="delete-error">
          {deleteError}
        </p>
      )}

      {items.length === 0 ? (
        <div data-testid="assignments-empty">
          <h2>{copy.assignmentsList.empty.heading}</h2>
          <p>{copy.assignmentsList.empty.description}</p>
          <Link href="/assignments/create" data-testid="create-first-assignment">
            {copy.assignmentsList.empty.cta}
          </Link>
        </div>
      ) : (
        <>
          <div data-testid="assignments-list">
            {items.map((assignment: AssignmentSummary) => (
              <article key={assignment.id} data-testid={`assignment-card-${assignment.id}`}>
                <h3 data-testid={`assignment-title-${assignment.id}`}>{assignment.title}</h3>
                <p data-testid={`assignment-assigned-${assignment.id}`}>
                  {copy.assignmentsList.card.assignedOn}{' '}
                  {formatDateTime(assignment.assignedAt)}
                </p>
                <p data-testid={`assignment-due-${assignment.id}`}>
                  {copy.assignmentsList.card.due} {formatDate(assignment.dueDate)}
                </p>

                {/* Kebab menu */}
                <div>
                  <button
                    type="button"
                    aria-label={`${copy.assignmentsList.card.menuLabel}: ${assignment.title}`}
                    aria-expanded={openMenuId === assignment.id}
                    aria-haspopup="menu"
                    data-testid={`kebab-menu-${assignment.id}`}
                    onClick={() =>
                      setOpenMenuId(openMenuId === assignment.id ? null : assignment.id)
                    }
                  >
                    ⋮
                  </button>

                  {openMenuId === assignment.id && (
                    <ul role="menu" data-testid={`dropdown-${assignment.id}`}>
                      <li role="none">
                        <Link
                          href={`/assignments/${assignment.id}`}
                          role="menuitem"
                          data-testid={`view-${assignment.id}`}
                          onClick={() => setOpenMenuId(null)}
                        >
                          {copy.assignmentsList.card.viewAssignment}
                        </Link>
                      </li>
                      <li role="none">
                        <button
                          type="button"
                          role="menuitem"
                          data-testid={`delete-${assignment.id}`}
                          onClick={() => void handleDelete(assignment.id)}
                        >
                          {copy.assignmentsList.card.delete}
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>

          <Link href="/assignments/create" data-testid="create-assignment-button">
            {copy.assignmentsList.createButton}
          </Link>
        </>
      )}
    </section>
  );
}
