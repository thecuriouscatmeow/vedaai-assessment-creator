/**
 * TDD tests for AssignmentPDF document and PDFDownloadLink wiring in QuestionPaperView.
 *
 * @react-pdf/renderer resolves to the manual mock at src/__mocks__/@react-pdf/renderer.tsx
 * via the vitest.config.ts alias — no per-file vi.mock() needed.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithStore } from './helpers';
import { QuestionPaperView } from '@/components/QuestionPaperView';
import type { QuestionPaper } from '@vedaai/shared';

const mockPaper: QuestionPaper = {
  title: 'Test Paper',
  schoolName: 'Test School',
  subject: 'Mathematics',
  className: 'Grade 10',
  totalMarks: 100,
  studentInfo: {},
  sections: [
    {
      title: 'Section A',
      questions: [
        {
          text: 'What is 2+2?',
          difficulty: 'easy',
          marks: 5,
          answer: '4',
        },
      ],
    },
  ],
};

describe('PDF download', () => {
  it('renders a pdf-download-link when paper is provided', () => {
    renderWithStore(<QuestionPaperView paper={mockPaper} />);
    expect(screen.getByTestId('pdf-download-link')).toBeInTheDocument();
  });

  it('shows "Download as PDF" text when not loading', () => {
    renderWithStore(<QuestionPaperView paper={mockPaper} />);
    expect(screen.getByText('Download as PDF')).toBeInTheDocument();
  });

  it('preserves download-pdf-button testid on the inner span', () => {
    renderWithStore(<QuestionPaperView paper={mockPaper} />);
    expect(screen.getByTestId('download-pdf-button')).toBeInTheDocument();
  });
});
