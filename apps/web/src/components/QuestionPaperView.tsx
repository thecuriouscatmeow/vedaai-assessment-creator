import type { QuestionPaper } from '@vedaai/shared';
import copy from '@/content/copy.json';

interface Props {
  paper: QuestionPaper;
}

/**
 * QuestionPaperView — structural wireframe of a generated question paper.
 *
 * Renders all QuestionPaper contract fields without decorative styling (Phase 5
 * handles Figma design tokens). Blank studentInfo fields are printed as
 * label + fill-in line, as they would appear on a physical printed paper.
 *
 * Includes a collated Answer Key section built from each question's `answer`.
 */
export function QuestionPaperView({ paper }: Props) {
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
    <article aria-label={paper.title}>
      {/* Paper header */}
      <header>
        <h1>{paper.title}</h1>
        <address>
          <p>{paper.schoolName}</p>
          {paper.schoolAddress && <p>{paper.schoolAddress}</p>}
        </address>
        <dl>
          <div>
            <dt>{copy.output.subject}</dt>
            <dd>{paper.subject}</dd>
          </div>
          <div>
            <dt className="sr-only">Class</dt>
            <dd>{paper.className}</dd>
          </div>
          {paper.durationMinutes !== undefined && (
            <div>
              <dt>{copy.output.timeAllowed}</dt>
              <dd>
                {paper.durationMinutes} {copy.output.minutes}
              </dd>
            </div>
          )}
          <div>
            <dt>{copy.output.maximumMarks}</dt>
            <dd>{paper.totalMarks}</dd>
          </div>
        </dl>
      </header>

      {/* General instructions */}
      {paper.generalInstructions && (
        <section aria-label={copy.output.generalInstructions}>
          <h2>{copy.output.generalInstructions}</h2>
          <p>{paper.generalInstructions}</p>
        </section>
      )}

      {/* Student info — blank fill-in fields for printing */}
      <section aria-label="Student information">
        <dl>
          <div>
            <dt>{copy.output.studentInfo.name}</dt>
            <dd data-testid="student-name">
              {paper.studentInfo.name ?? copy.output.studentInfo.fillIn}
            </dd>
          </div>
          <div>
            <dt>{copy.output.studentInfo.rollNumber}</dt>
            <dd data-testid="student-roll">
              {paper.studentInfo.rollNumber ?? copy.output.studentInfo.fillIn}
            </dd>
          </div>
          <div>
            <dt>{copy.output.studentInfo.section}</dt>
            <dd data-testid="student-section">
              {paper.studentInfo.section ?? copy.output.studentInfo.fillIn}
            </dd>
          </div>
        </dl>
      </section>

      {/* Sections */}
      {paper.sections.map((section, sIdx) => (
        <section key={sIdx} aria-label={section.title}>
          <h2>{section.title}</h2>
          {section.instruction && <p>{section.instruction}</p>}
          <ol>
            {section.questions.map((question, qIdx) => {
              renderNumber++;
              return (
                <li key={qIdx} data-testid={`question-${String(sIdx)}-${String(qIdx)}`}>
                  <span data-testid={`question-number-${String(sIdx)}-${String(qIdx)}`}>
                    {renderNumber}.
                  </span>
                  <span>{question.text}</span>
                  <span data-testid={`difficulty-${String(sIdx)}-${String(qIdx)}`}>
                    {copy.output.difficulty[question.difficulty]}
                  </span>
                  <span data-testid={`marks-${String(sIdx)}-${String(qIdx)}`}>
                    {question.marks} {copy.output.marks}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {/* Answer Key */}
      {allAnswers.length > 0 && (
        <section aria-label={copy.output.answerKey.heading} data-testid="answer-key">
          <h2>{copy.output.answerKey.heading}</h2>
          <ol>
            {allAnswers.map(({ number, text, answer }) => (
              <li key={number} data-testid={`answer-${String(number)}`}>
                <strong>
                  {copy.output.answerKey.questionLabel}
                  {number}.
                </strong>{' '}
                <span data-testid={`answer-question-${String(number)}`}>{text}</span>
                <p data-testid={`answer-text-${String(number)}`}>{answer}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Download as PDF */}
      <button
        type="button"
        onClick={() => window.print()}
        data-testid="download-pdf-button"
      >
        {copy.output.downloadPdf}
      </button>
    </article>
  );
}
