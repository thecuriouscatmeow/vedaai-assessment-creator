/**
 * RTL tests for AssignmentForm (step 1: fields + validation + field array,
 * and submit → step 2 store transitions). Matches the dropdown-table design:
 * each question row is { type (select), count, marks }, submit is "Next".
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from './helpers';
import { AssignmentForm } from '@/components/AssignmentForm';

// Isolate side-effecting hooks.
vi.mock('@/lib/useCloudinaryUpload', () => ({
  useCloudinaryUpload: () => ({ upload: vi.fn().mockResolvedValue(null) }),
}));
vi.mock('@/lib/useAssignmentSocket', () => ({
  useAssignmentSocket: () => vi.fn(),
}));

const FAKE_ASSIGNMENT_ID = 'test-assign-001';

function setupFetch(ok: boolean, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  });
}

describe('AssignmentForm — step 1: field rendering', () => {
  it('renders the section heading', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByRole('heading', { name: /assignment details/i })).toBeInTheDocument();
  });

  it('renders the optional file upload input', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByLabelText(/upload source file/i)).toBeInTheDocument();
  });

  it('renders the due date input', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('renders a default question row with a type dropdown, count and marks', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByTestId('question-row-0')).toBeInTheDocument();
    expect(screen.getByLabelText(/question type 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/no\. of questions row 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marks row 1/i)).toBeInTheDocument();
  });

  it('renders the additional information textarea', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByLabelText(/additional information/i)).toBeInTheDocument();
  });

  it('renders the Next (submit) and Add Question Type buttons', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add question type/i })).toBeInTheDocument();
  });

  it('shows live totals', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.getByTestId('question-totals')).toBeInTheDocument();
  });
});

describe('AssignmentForm — step 1: validation', () => {
  beforeEach(() => setupFetch(true, { assignmentId: FAKE_ASSIGNMENT_ID }));
  afterEach(() => vi.restoreAllMocks());

  it('blocks submit and shows an error when due date is missing', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentForm />);
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent?.includes('Due date'))).toBe(true);
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('AssignmentForm — step 1: field array (add/remove rows)', () => {
  it('adds a second question row when Add Question Type is clicked', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentForm />);
    await user.click(screen.getByRole('button', { name: /add question type/i }));
    expect(screen.getByTestId('question-row-1')).toBeInTheDocument();
  });

  it('does not show a Remove button when only one row exists', () => {
    renderWithStore(<AssignmentForm />);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('removes a row when Remove is clicked', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentForm />);
    await user.click(screen.getByRole('button', { name: /add question type/i }));
    expect(screen.getByTestId('question-row-1')).toBeInTheDocument();
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]!);
    expect(screen.queryByTestId('question-row-1')).not.toBeInTheDocument();
  });
});

describe('AssignmentForm — submit → step 2 store transitions', () => {
  beforeEach(() => setupFetch(true, { assignmentId: FAKE_ASSIGNMENT_ID }));
  afterEach(() => vi.restoreAllMocks());

  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText(/due date/i), '2026-06-30');
    await user.click(screen.getByRole('button', { name: /^next$/i }));
  }

  it('dispatches enqueued with the returned assignmentId and advances to step 2', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<AssignmentForm />);
    await fillAndSubmit(user);
    await waitFor(() => {
      expect(store.getState().generation.status).toBe('queued');
    });
    expect(store.getState().generation.assignmentId).toBe(FAKE_ASSIGNMENT_ID);
    expect(store.getState().assignmentForm.currentStep).toBe(2);
  });

  it('stores the validated form values', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<AssignmentForm />);
    await fillAndSubmit(user);
    await waitFor(() => {
      expect(store.getState().assignmentForm.values).not.toBeNull();
    });
    expect(store.getState().assignmentForm.values?.dueDate).toBe('2026-06-30');
  });
});
