/**
 * RTL tests for AssignmentsList — empty state, filled state (card grid),
 * and status chip rendering with proper color coding.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from './helpers';
import { AssignmentsList } from '@/components/AssignmentsList';
import { fetchSuccess } from '@/store/slices/assignmentsSlice';
import type { AssignmentSummary } from '@vedaai/shared';

// Mock next/navigation and next/link
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function setupFetch(ok: boolean, body: unknown) {
  global.fetch = vi
    .fn()
    .mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(body),
    }) as unknown as typeof global.fetch;
}

const mockAssignments: AssignmentSummary[] = [
  {
    id: 'asgn-1',
    title: 'Math Test Q1',
    status: 'done' as const,
    assignedAt: '2026-05-26T10:00:00Z',
    dueDate: '2026-05-30',
  },
  {
    id: 'asgn-2',
    title: 'Physics Final',
    status: 'processing' as const,
    assignedAt: '2026-05-27T14:30:00Z',
    dueDate: '2026-06-05',
  },
  {
    id: 'asgn-3',
    title: 'History Essay',
    status: 'queued' as const,
    assignedAt: '2026-05-28T09:15:00Z',
    dueDate: '2026-06-10',
  },
  {
    id: 'asgn-4',
    title: 'Chemistry Lab Report',
    status: 'failed' as const,
    assignedAt: '2026-05-25T11:00:00Z',
    dueDate: '2026-05-29',
  },
];

describe('AssignmentsList — empty state', () => {
  beforeEach(() => {
    setupFetch(true, []);
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders the empty state illustration and heading', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /no assignments yet/i })
      ).toBeInTheDocument();
    });
  });

  it('renders the empty state subtext', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(
        screen.getByText(/Create your first assignment to start collecting and grading/i)
      ).toBeInTheDocument();
    });
  });

  it('renders the "Create Your First Assignment" button', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('link', {
        name: /create your first assignment/i,
      });
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('shows loading state while fetching', () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof global.fetch; // never resolves
    renderWithStore(<AssignmentsList />);
    expect(screen.getByTestId('assignments-loading')).toBeInTheDocument();
  });
});

describe('AssignmentsList — filled state (card grid)', () => {
  beforeEach(() => {
    setupFetch(true, mockAssignments);
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders a card for each assignment', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      mockAssignments.forEach((asgn) => {
        expect(screen.getByTestId(`assignment-card-${asgn.id}`)).toBeInTheDocument();
      });
    });
  });

  it('shows the assignment title on each card', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      mockAssignments.forEach((asgn) => {
        expect(screen.getByText(asgn.title)).toBeInTheDocument();
      });
    });
  });

  it('renders the page heading "Assignments"', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: /^assignments$/i });
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('renders a "New Assignment" button in the header', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new assignment/i })).toBeInTheDocument();
    });
  });

  it('displays due date for each assignment', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      mockAssignments.forEach((asgn) => {
        expect(screen.getByTestId(`assignment-due-${asgn.id}`)).toBeInTheDocument();
      });
    });
  });
});

describe('AssignmentsList — status chips', () => {
  beforeEach(() => {
    setupFetch(true, mockAssignments);
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders a "Done" chip for done assignments with correct styling', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      const doneChip = screen
        .getByText('Done', { selector: '[data-testid="status-chip-asgn-1"]' })
        .closest('[data-testid="status-chip-asgn-1"]');
      expect(doneChip).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  it('renders a "Processing" chip for processing assignments with correct styling', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      const processingChip = screen
        .getByText('Processing', { selector: '[data-testid="status-chip-asgn-2"]' })
        .closest('[data-testid="status-chip-asgn-2"]');
      expect(processingChip).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  it('renders a "Queued" chip for queued assignments with correct styling', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      const queuedChip = screen
        .getByText('Queued', { selector: '[data-testid="status-chip-asgn-3"]' })
        .closest('[data-testid="status-chip-asgn-3"]');
      expect(queuedChip).toHaveClass('bg-amber-100', 'text-amber-800');
    });
  });

  it('renders a "Failed" chip for failed assignments with correct styling', async () => {
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      const failedChip = screen
        .getByText('Failed', { selector: '[data-testid="status-chip-asgn-4"]' })
        .closest('[data-testid="status-chip-asgn-4"]');
      expect(failedChip).toHaveClass('bg-red-100', 'text-red-800');
    });
  });
});

describe('AssignmentsList — user interactions', () => {
  beforeEach(() => {
    setupFetch(true, mockAssignments);
  });
  afterEach(() => vi.restoreAllMocks());

  it('opens the kebab menu when clicked', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`)).toBeInTheDocument();
    });
    await user.click(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`));
    expect(screen.getByTestId(`dropdown-${mockAssignments[0]!.id}`)).toBeInTheDocument();
  });

  it('closes the kebab menu when clicking the button again', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`)).toBeInTheDocument();
    });
    const menuButton = screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`);
    await user.click(menuButton);
    expect(screen.getByTestId(`dropdown-${mockAssignments[0]!.id}`)).toBeInTheDocument();
    await user.click(menuButton);
    expect(screen.queryByTestId(`dropdown-${mockAssignments[0]!.id}`)).not.toBeInTheDocument();
  });

  it('shows View Assignment and Delete menu items when menu is open', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`)).toBeInTheDocument();
    });
    await user.click(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`));
    expect(screen.getByTestId(`view-${mockAssignments[0]!.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`delete-${mockAssignments[0]!.id}`)).toBeInTheDocument();
  });

  it('displays delete error when delete fails', async () => {
    const user = userEvent.setup();
    renderWithStore(<AssignmentsList />);
    await waitFor(() => {
      expect(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`)).toBeInTheDocument();
    });

    // Mock a failed delete
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response);

    await user.click(screen.getByTestId(`kebab-menu-${mockAssignments[0]!.id}`));
    await user.click(screen.getByTestId(`delete-${mockAssignments[0]!.id}`));

    await waitFor(() => {
      expect(screen.getByTestId('delete-error')).toBeInTheDocument();
    });
  });
});
