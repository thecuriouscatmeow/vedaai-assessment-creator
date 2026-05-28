/**
 * Unit tests for RegenerateBar — verifies render gating on form values,
 * button state transitions driven by generation.status, and re-enqueue flow.
 *
 * TDD: these tests are written BEFORE the implementation (RED → GREEN).
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithStore } from './helpers';
import type { AssignmentInput } from '@vedaai/shared';
import { makeStore } from '@/store';

// Mock next/navigation before importing the component under test.
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  usePathname: () => '/assignments/some-id',
}));

// Import after the mock is set up.
import { RegenerateBar } from '@/components/RegenerateBar';

const mockInput: AssignmentInput = {
  dueDate: '2026-06-01',
  questions: [{ type: 'mcq', count: 5, marks: 2 }],
};

describe('RegenerateBar', () => {
  it('renders when assignmentForm.values is not null', () => {
    const store = makeStore();
    store.dispatch({ type: 'assignmentForm/setFormValues', payload: mockInput });
    renderWithStore(<RegenerateBar />, { store });
    expect(screen.getByRole('button', { name: /Regenerate/i })).toBeInTheDocument();
  });

  it('returns null when assignmentForm.values is null', () => {
    const { container } = renderWithStore(<RegenerateBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows "Regenerate" button when status is idle or done', () => {
    const store = makeStore();
    store.dispatch({ type: 'assignmentForm/setFormValues', payload: mockInput });
    renderWithStore(<RegenerateBar />, { store });
    const btn = screen.getByRole('button', { name: /Regenerate/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows "Generating…" and disables button when status is processing', () => {
    const store = makeStore();
    store.dispatch({ type: 'assignmentForm/setFormValues', payload: mockInput });
    store.dispatch({ type: 'generation/enqueued', payload: { assignmentId: 'x' } });
    store.dispatch({ type: 'generation/processing' });
    renderWithStore(<RegenerateBar />, { store });
    const btn = screen.getByRole('button', { name: /Generating/i });
    expect(btn).toBeDisabled();
  });

  it('dispatches resetGeneration when Regenerate is clicked', async () => {
    const store = makeStore();
    const dispatchSpy = vi.spyOn(store, 'dispatch');
    store.dispatch({ type: 'assignmentForm/setFormValues', payload: mockInput });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ assignmentId: 'new-id' }),
    });
    renderWithStore(<RegenerateBar />, { store });
    fireEvent.click(screen.getByRole('button', { name: /Regenerate/i }));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'generation/resetGeneration' }),
    );
  });
});
