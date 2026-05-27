/**
 * Smoke test — proves vitest + RTL + jest-dom harness is wired correctly.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function SmokeComponent() {
  return <p data-testid="smoke">harness ok</p>;
}

describe('test harness', () => {
  it('renders a component and finds it in the DOM', () => {
    render(<SmokeComponent />);
    expect(screen.getByTestId('smoke')).toHaveTextContent('harness ok');
  });
});
