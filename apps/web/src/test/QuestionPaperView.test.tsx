/**
 * RTL tests for QuestionPaperView.
 *
 * Given a sample QuestionPaper (new contract: schoolName + className at the
 * paper level, studentInfo blanks, per-question answer → Answer Key), verifies
 * the structural elements render with correct counts and values.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionPaperView } from '@/components/QuestionPaperView';
import type { QuestionPaper } from '@vedaai/shared';

const SAMPLE_PAPER: QuestionPaper = {
  title: 'Annual Mathematics Examination',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  subject: 'Mathematics',
  className: '10-A',
  totalMarks: 80,
  durationMinutes: 180,
  generalInstructions: 'All questions are compulsory.',
  studentInfo: {},
  sections: [
    {
      title: 'Section A — MCQ',
      instruction: 'Choose the best option.',
      questions: [
        { text: 'What is the value of π?', difficulty: 'easy', marks: 2, answer: '≈ 3.14159' },
        { text: 'Solve: x² − 9 = 0', difficulty: 'moderate', marks: 4, answer: 'x = ±3' },
      ],
    },
    {
      title: 'Section B — Long Answer',
      questions: [
        { text: 'Prove the Pythagorean theorem.', difficulty: 'challenging', marks: 10 },
      ],
    },
  ],
};

describe('QuestionPaperView', () => {
  it('renders the paper title and school name', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(
      screen.getByRole('heading', { name: /Annual Mathematics Examination/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Delhi Public School/i)).toBeInTheDocument();
  });

  it('renders subject, class, duration and total marks', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('10-A')).toBeInTheDocument();
    expect(screen.getByText(/180/)).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('renders generalInstructions', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByText(/All questions are compulsory/i)).toBeInTheDocument();
  });

  it('renders both section headings and the section instruction', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByRole('heading', { name: /Section A — MCQ/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Section B — Long Answer/i })).toBeInTheDocument();
    expect(screen.getByText(/Choose the best option/i)).toBeInTheDocument();
  });

  it('renders every question (3 total) with correct text', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    // Scope to the question-row testids — the text also appears in the Answer Key.
    expect(screen.getByTestId('question-0-0')).toHaveTextContent(/What is the value of π/i);
    expect(screen.getByTestId('question-0-1')).toHaveTextContent(/Solve: x² − 9 = 0/i);
    expect(screen.getByTestId('question-1-0')).toHaveTextContent(/Prove the Pythagorean theorem/i);
  });

  it('renders difficulty tags (easy/moderate/challenging)', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByTestId('difficulty-0-0')).toHaveTextContent(/easy/i);
    expect(screen.getByTestId('difficulty-0-1')).toHaveTextContent(/moderate/i);
    expect(screen.getByTestId('difficulty-1-0')).toHaveTextContent(/challenging/i);
  });

  it('renders marks for each question', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByTestId('marks-0-0')).toHaveTextContent('2');
    expect(screen.getByTestId('marks-0-1')).toHaveTextContent('4');
    expect(screen.getByTestId('marks-1-0')).toHaveTextContent('10');
  });

  it('renders student fill-in labels', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Roll Number:')).toBeInTheDocument();
    expect(screen.getByText('Class & Section:')).toBeInTheDocument();
  });

  it('renders a collated Answer Key from question answers', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByTestId('answer-key')).toBeInTheDocument();
    expect(screen.getByTestId('answer-text-1')).toHaveTextContent(/3\.14159/);
    expect(screen.getByTestId('answer-text-2')).toHaveTextContent(/x = ±3/);
  });

  it('renders a Download as PDF button', () => {
    render(<QuestionPaperView paper={SAMPLE_PAPER} />);
    expect(screen.getByTestId('download-pdf-button')).toBeInTheDocument();
  });

  it('omits the Answer Key when no question has an answer', () => {
    const noAnswers: QuestionPaper = {
      ...SAMPLE_PAPER,
      sections: [
        { title: 'A', questions: [{ text: 'Q', difficulty: 'easy', marks: 1 }] },
      ],
    };
    render(<QuestionPaperView paper={noAnswers} />);
    expect(screen.queryByTestId('answer-key')).not.toBeInTheDocument();
  });

  it('renders without durationMinutes gracefully', () => {
    const paper: QuestionPaper = { ...SAMPLE_PAPER, durationMinutes: undefined };
    render(<QuestionPaperView paper={paper} />);
    expect(screen.queryByText(/Time Allowed:/i)).not.toBeInTheDocument();
  });
});
