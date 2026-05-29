/**
 * RTL tests for MobileNavDrawer — open/close and escape key.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from './helpers';
import { MobileNavDrawer } from '@/components/nav/MobileNavDrawer';

vi.mock('next/navigation', () => ({
  usePathname: () => '/assignments',
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

describe('MobileNavDrawer', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithStore(
      <MobileNavDrawer open={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders navigation dialog when open', () => {
    renderWithStore(<MobileNavDrawer open onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithStore(<MobileNavDrawer open onClose={onClose} />);
    await user.click(screen.getByLabelText('Close navigation menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    renderWithStore(<MobileNavDrawer open onClose={onClose} />);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
