/**
 * RTL tests for BottomTabBar.
 * Hide/show logic: bar is hidden when pathname matches an assignment detail
 * page (e.g. /assignments/<id>) but visible for /assignments and
 * /assignments/create.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithStore } from './helpers';

// Mock next/navigation before importing the component under test.
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

// Import after the mock is set up.
import { BottomTabBar } from '@/components/nav/BottomTabBar';

describe('BottomTabBar', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it('renders 4 tab labels', () => {
    mockUsePathname.mockReturnValue('/assignments');
    const { container } = renderWithStore(<BottomTabBar />);
    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Assignments')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('AI Toolkit')).toBeInTheDocument();
  });

  it('returns null when pathname is an assignment detail page', () => {
    mockUsePathname.mockReturnValue('/assignments/abc-123-def');
    const { container } = renderWithStore(<BottomTabBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders when pathname is /assignments', () => {
    mockUsePathname.mockReturnValue('/assignments');
    const { container } = renderWithStore(<BottomTabBar />);
    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('renders when pathname is /assignments/create', () => {
    mockUsePathname.mockReturnValue('/assignments/create');
    const { container } = renderWithStore(<BottomTabBar />);
    expect(container).not.toBeEmptyDOMElement();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });
});
