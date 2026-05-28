'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AssignmentSummary, AssignmentStatus } from '@vedaai/shared';
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
 * Filled state: max-width-7xl container with header (title + "New Assignment" button)
 * and a responsive grid of cards showing title, status chip, due date, and kebab menu.
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

  function getStatusChipColors(status: AssignmentStatus) {
    const colorMap: Record<AssignmentStatus, { bg: string; text: string }> = {
      done: { bg: 'bg-green-100', text: 'text-green-800' },
      failed: { bg: 'bg-red-100', text: 'text-red-800' },
      queued: { bg: 'bg-amber-100', text: 'text-amber-800' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    };
    return colorMap[status];
  }

  function getStatusLabel(status: AssignmentStatus): string {
    return copy.assignmentsList.status[status];
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

  // Empty state (Figma page 01)
  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60dvh] gap-8 text-center px-4"
        data-testid="assignments-empty"
      >
        {/* Illustration placeholder */}
        <div className="size-[clamp(12rem,30vw,18.75rem)] rounded-full bg-surface-hover flex items-center justify-center text-[4rem]">
          📋
        </div>
        <div className="flex flex-col gap-3 items-center max-w-[30rem]">
          <h2 className="font-bold text-p1 text-text-primary">
            {copy.assignmentsList.empty.heading}
          </h2>
          <p className="text-p3 text-text-secondary/80">
            {copy.assignmentsList.empty.subtext}
          </p>
        </div>
        <Link
          href="/assignments/create"
          data-testid="create-first-assignment"
          className="bg-btn-dark border border-white/50 rounded-full flex items-center gap-1 px-6 py-3 text-white text-p3 font-medium hover:bg-opacity-90 transition-all"
        >
          <span>+</span>
          <span>{copy.assignmentsList.empty.cta}</span>
        </Link>
      </div>
    );
  }

  // Filled state (Figma page 02)
  return (
    <div className="max-w-7xl mx-auto px-4">
      {deleteError && (
        <p role="alert" data-testid="delete-error" className="mb-4 text-p3 text-red-600">
          {deleteError}
        </p>
      )}

      {/* Header row: title + "New Assignment" button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-p1 text-text-primary">{copy.assignmentsList.heading}</h1>
        <Link
          href="/assignments/create"
          data-testid="create-assignment-button"
          className="bg-btn-dark border border-white/50 rounded-full flex items-center gap-1 px-5 py-2 text-white text-p4 font-medium hover:bg-opacity-90 transition-all"
        >
          <span>+</span>
          <span>{copy.assignmentsList.newButton}</span>
        </Link>
      </div>

      {/* Card grid: grid-cols-1 sm:grid-cols-2 gap-4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="assignments-list">
        {items.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            openMenuId={openMenuId}
            setOpenMenuId={setOpenMenuId}
            onDelete={handleDelete}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            getStatusChipColors={getStatusChipColors}
            getStatusLabel={getStatusLabel}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * AssignmentCard — a single card rendered in the assignments grid.
 * Shows title, status chip, due date, and a kebab menu with View/Delete actions.
 */
interface AssignmentCardProps {
  assignment: AssignmentSummary;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onDelete: (id: string) => void;
  formatDate: (iso: string) => string;
  formatDateTime: (iso: string) => string;
  getStatusChipColors: (status: AssignmentStatus) => { bg: string; text: string };
  getStatusLabel: (status: AssignmentStatus) => string;
}

function AssignmentCard({
  assignment,
  openMenuId,
  setOpenMenuId,
  onDelete,
  formatDate,
  formatDateTime,
  getStatusChipColors,
  getStatusLabel,
}: AssignmentCardProps) {
  const { bg, text } = getStatusChipColors(assignment.status);
  const statusLabel = getStatusLabel(assignment.status);

  return (
    <article
      key={assignment.id}
      data-testid={`assignment-card-${assignment.id}`}
      className="bg-surface rounded-[16px] shadow-[var(--shadow-card)] p-4 flex flex-col gap-3 hover:bg-surface-hover transition-colors"
    >
      {/* Title */}
      <div className="flex-1">
        <h3
          data-testid={`assignment-title-${assignment.id}`}
          className="font-bold text-p3 text-text-primary"
        >
          {assignment.title}
        </h3>
      </div>

      {/* Status chip */}
      <div
        data-testid={`status-chip-${assignment.id}`}
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-p5 font-medium w-fit ${bg} ${text}`}
      >
        {statusLabel}
      </div>

      {/* Metadata: assigned date and due date */}
      <div className="flex flex-col gap-1 text-p4 text-text-secondary">
        <p data-testid={`assignment-assigned-${assignment.id}`}>
          {copy.assignmentsList.card.assignedOn} {formatDateTime(assignment.assignedAt)}
        </p>
        <p data-testid={`assignment-due-${assignment.id}`}>
          {copy.assignmentsList.card.due} {formatDate(assignment.dueDate)}
        </p>
      </div>

      {/* Kebab menu with View/Delete */}
      <div className="pt-2 border-t border-grey-3 flex justify-end">
        <div className="relative">
          <button
            type="button"
            aria-label={`${copy.assignmentsList.card.menuLabel}: ${assignment.title}`}
            aria-expanded={openMenuId === assignment.id}
            aria-haspopup="menu"
            data-testid={`kebab-menu-${assignment.id}`}
            onClick={() => setOpenMenuId(openMenuId === assignment.id ? null : assignment.id)}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors"
          >
            ⋮
          </button>

          {openMenuId === assignment.id && (
            <ul
              role="menu"
              data-testid={`dropdown-${assignment.id}`}
              className="absolute right-0 top-full mt-1 bg-surface border border-grey-3 rounded-lg shadow-[var(--shadow-card)] z-10 min-w-[150px]"
            >
              <li role="none">
                <Link
                  href={`/assignments/${assignment.id}`}
                  role="menuitem"
                  data-testid={`view-${assignment.id}`}
                  onClick={() => setOpenMenuId(null)}
                  className="block px-4 py-2 text-p4 text-text-primary hover:bg-surface-hover transition-colors first:rounded-t-lg"
                >
                  {copy.assignmentsList.card.viewAssignment}
                </Link>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  data-testid={`delete-${assignment.id}`}
                  onClick={() => onDelete(assignment.id)}
                  className="w-full text-left px-4 py-2 text-p4 text-error hover:bg-surface-hover transition-colors last:rounded-b-lg"
                >
                  {copy.assignmentsList.card.delete}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
