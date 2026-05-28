import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DifficultyBadge } from '@/components/DifficultyBadge';

describe('DifficultyBadge', () => {
  it('renders "Easy" label for easy difficulty', () => {
    render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('renders "Moderate" label for moderate difficulty', () => {
    render(<DifficultyBadge difficulty="moderate" />);
    expect(screen.getByText('Moderate')).toBeInTheDocument();
  });

  it('renders "Challenging" label for challenging difficulty', () => {
    render(<DifficultyBadge difficulty="challenging" />);
    expect(screen.getByText('Challenging')).toBeInTheDocument();
  });

  it('applies green styles for easy', () => {
    const { container } = render(<DifficultyBadge difficulty="easy" />);
    expect(container.firstChild).toHaveClass('bg-green-100');
  });

  it('applies amber styles for moderate', () => {
    const { container } = render(<DifficultyBadge difficulty="moderate" />);
    expect(container.firstChild).toHaveClass('bg-amber-100');
  });

  it('applies red styles for challenging', () => {
    const { container } = render(<DifficultyBadge difficulty="challenging" />);
    expect(container.firstChild).toHaveClass('bg-red-100');
  });
});
