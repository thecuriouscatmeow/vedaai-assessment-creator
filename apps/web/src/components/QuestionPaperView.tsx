'use client';

import { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import type { QuestionPaper } from '@vedaai/shared';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import copy from '@/content/copy.json';
import { AssignmentPDF } from '@/components/AssignmentPDF';
import { figmaAssets } from '@/lib/figmaAssets';

interface Props {
  paper: QuestionPaper;
}

/**
 * QuestionPaperView — Figma page 04 "Assignment Output" layout.
 *
 * Renders the full generated question paper with styled sections, per-question
 * DifficultyBadge chips, a collapsible Answer Key, and a Download button slot
 * (T6 will wire the actual @react-pdf/renderer export).
 *
 * All data-testid attributes from the frozen test suite are preserved.
 */
export function QuestionPaperView({ paper }: Props) {
  const [answerKeyOpen, setAnswerKeyOpen] = useState(true);

  // Flatten all questions for the answer key, tracking global number
  let questionNumber = 0;
  const allAnswers: { number: number; text: string; answer: string }[] = [];

  for (const section of paper.sections) {
    for (const question of section.questions) {
      questionNumber++;
      if (question.answer) {
        allAnswers.push({ number: questionNumber, text: question.text, answer: question.answer });
      }
    }
  }

  // Reset counter for rendering
  let renderNumber = 0;

  return (
    <article
      aria-label={paper.title}
      className="max-w-[700px] mx-auto mt-[clamp(2rem,5dvh,4rem)] mb-16 bg-surface rounded-[24px] shadow-[var(--shadow-modal)] p-8 sm:p-10 flex flex-col gap-6"
    >
      {/* Paper header */}
      <header className="flex flex-col gap-2">
        <img
          src={figmaAssets.output.headerArt}
          alt=""
          aria-hidden="true"
          className="w-full h-28 object-cover rounded-[16px]"
        />
        <h1 className="font-bold text-p1 text-text-primary text-center">{paper.title}</h1>
        <p className="font-bold text-p1 text-text-primary text-center">{paper.schoolName}</p>
        {paper.schoolAddress && (
          <p className="text-p4 text-text-secondary text-center">{paper.schoolAddress}</p>
        )}
        <hr className="border-grey-2 my-2" />
        {/* Info row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-p4 text-text-primary">
            {copy.output.subject}{' '}
            <span className="font-medium">{paper.subject}</span>
          </span>
          <span className="text-p4 text-text-primary">
            {copy.output.className}{' '}
            <span className="font-medium">{paper.className}</span>
          </span>
          {paper.durationMinutes !== undefined && (
            <span className="text-p4 text-text-primary">
              {copy.output.timeAllowed}{' '}
              <span className="font-medium">
                {paper.durationMinutes} {copy.output.minutes}
              </span>
            </span>
          )}
          <span className="bg-btn-dark text-white rounded-full px-3 py-1 text-p5 font-medium">
            {copy.output.maximumMarks}{' '}
            <span>{paper.totalMarks}</span>
          </span>
        </div>
      </header>

      {/* General instructions */}
      {paper.generalInstructions && (
        <section aria-label={copy.output.generalInstructions} className="flex flex-col gap-1">
          <h2 className="font-semibold text-p4 text-text-primary">
            {copy.output.generalInstructions}
          </h2>
          <p className="text-p4 text-text-secondary italic">{paper.generalInstructions}</p>
        </section>
      )}

      {/* Student info — blank fill-in fields for printing */}
      <section
        aria-label="Student information"
        className="bg-surface-hover rounded-[12px] p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {/* Name */}
        <div className="flex flex-col gap-1">
          <span className="text-p5 text-text-secondary font-medium">
            {copy.output.studentInfo.name}
          </span>
          <span
            data-testid="student-name"
            className="border-b border-grey-2 h-6 text-p4 text-text-primary"
          >
            {paper.studentInfo.name ?? copy.output.studentInfo.fillIn}
          </span>
        </div>
        {/* Roll Number */}
        <div className="flex flex-col gap-1">
          <span className="text-p5 text-text-secondary font-medium">
            {copy.output.studentInfo.rollNumber}
          </span>
          <span
            data-testid="student-roll"
            className="border-b border-grey-2 h-6 text-p4 text-text-primary"
          >
            {paper.studentInfo.rollNumber ?? copy.output.studentInfo.fillIn}
          </span>
        </div>
        {/* Section */}
        <div className="flex flex-col gap-1">
          <span className="text-p5 text-text-secondary font-medium">
            {copy.output.studentInfo.section}
          </span>
          <span
            data-testid="student-section"
            className="border-b border-grey-2 h-6 text-p4 text-text-primary"
          >
            {paper.studentInfo.section ?? copy.output.studentInfo.fillIn}
          </span>
        </div>
      </section>

      {/* Sections */}
      {paper.sections.map((section, sIdx) => (
        <section key={sIdx} aria-label={section.title}>
          <h2 className="font-bold text-p3 bg-surface-hover rounded px-2 py-1 inline-block mb-3">
            {section.title}
          </h2>
          {section.instruction && (
            <p className="text-p4 text-text-secondary italic mb-3">{section.instruction}</p>
          )}
          <ol className="list-none space-y-4">
            {section.questions.map((question, qIdx) => {
              renderNumber++;
              return (
                <li
                  key={qIdx}
                  data-testid={`question-${String(sIdx)}-${String(qIdx)}`}
                  className="flex items-start justify-between gap-4"
                >
                  {/* Left: number + text */}
                  <div className="flex gap-3">
                    <span
                      data-testid={`question-number-${String(sIdx)}-${String(qIdx)}`}
                      className="font-semibold text-p4 text-text-secondary w-8 shrink-0"
                    >
                      {renderNumber}.
                    </span>
                    <span className="text-p4 text-text-primary">{question.text}</span>
                  </div>
                  {/* Right: badge + marks */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span data-testid={`difficulty-${String(sIdx)}-${String(qIdx)}`}>
                      <DifficultyBadge difficulty={question.difficulty} />
                    </span>
                    <span
                      data-testid={`marks-${String(sIdx)}-${String(qIdx)}`}
                      className="text-p4 text-text-secondary"
                    >
                      [{question.marks} {copy.output.marks}]
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {/* Answer Key — collapsible */}
      {allAnswers.length > 0 && (
        <section aria-label={copy.output.answerKey.heading} data-testid="answer-key">
          <button
            type="button"
            aria-expanded={answerKeyOpen}
            onClick={() => setAnswerKeyOpen((prev) => !prev)}
            className="flex items-center gap-2 font-bold text-p3 text-text-primary cursor-pointer mb-3"
          >
            <span>{copy.output.answerKey.heading}</span>
            <img
              src={figmaAssets.output.collapseIcon}
              alt=""
              aria-hidden="true"
              className={`w-4 h-4 transition-transform ${answerKeyOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {answerKeyOpen && (
            <ol className="list-none space-y-3">
              {allAnswers.map(({ number, text, answer }) => (
                <li key={number} data-testid={`answer-${String(number)}`}>
                  <strong className="text-p4 text-text-primary">
                    {copy.output.answerKey.questionLabel}
                    {number}.
                  </strong>{' '}
                  <span
                    data-testid={`answer-question-${String(number)}`}
                    className="text-p4 text-text-secondary"
                  >
                    {text}
                  </span>
                  <p
                    data-testid={`answer-text-${String(number)}`}
                    className="text-p4 text-text-primary mt-1 ml-6"
                  >
                    {answer}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {/* Download as PDF — @react-pdf/renderer export via dynamic PDFDownloadLink */}
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<AssignmentPDF paper={paper} />}
          fileName={`${paper.title.replace(/\s+/g, '-')}.pdf`}
        >
          {({ loading }: { loading: boolean }) => (
            <span
              data-testid="download-pdf-button"
              className="bg-btn-dark text-white rounded-full px-6 py-3 text-p3 font-medium cursor-pointer inline-flex items-center gap-2"
            >
              <img src={figmaAssets.output.downloadIcon} alt="" aria-hidden="true" className="size-4" />
              {loading ? copy.output.downloadPdfPreparing : copy.output.downloadPdf}
            </span>
          )}
        </PDFDownloadLink>
      </div>
    </article>
  );
}
