import { QUESTION_TYPE_LABELS, type AssignmentInput } from '@vedaai/shared';

/**
 * Prompt builder for the LLM generation step.
 *
 * Produces a structured prompt that instructs the model to return a JSON object
 * conforming to the academic subset of the `QuestionPaper` schema (school
 * identity is injected by the worker after generation — the LLM does NOT produce
 * `schoolName` or `schoolAddress`).
 *
 * Uses `QUESTION_TYPE_LABELS` from `@vedaai/shared` so the model receives the
 * same human-readable labels displayed in the frontend dropdown.
 *
 * Callers treat the returned string as opaque; only `parsePaper` and the LLM
 * adapter care about the format.
 */
export function buildPrompt(input: AssignmentInput): string {
  const questionSpecLines = input.questions
    .map((q, i) => {
      const label = QUESTION_TYPE_LABELS[q.type];
      return `  ${i + 1}. ${label} — ${q.count} question(s), ${q.marks} mark(s) each`;
    })
    .join('\n');

  const extraInstructions = input.additionalInfo
    ? `\nAdditional instructions from the teacher: ${input.additionalInfo}`
    : '';

  // Note: fileUrl is handled as inlineData by the Gemini adapter; we still
  // mention the attachment in the prompt so the model knows to derive content
  // from the supplied material.
  const fileContext = input.fileUrl
    ? `\nAn image or PDF of source material has been attached inline. Use it to derive relevant, context-specific questions.`
    : '';

  return `You are an expert educator creating a well-structured exam question paper.

Generate a comprehensive question paper as a JSON object that EXACTLY matches the following TypeScript interface (QuestionPaper):

\`\`\`typescript
interface QuestionPaper {
  title: string;              // e.g. "Mid-Term Examination — Chapter 5"
  subject: string;            // derive from context (e.g. "Physics", "Mathematics")
  className: string;          // derive from context (e.g. "Class 10", "Grade 8")
  totalMarks: number;         // positive integer; MUST equal sum of all question marks
  durationMinutes?: number;   // recommended exam duration in minutes (positive integer)
  generalInstructions?: string; // overall exam instructions paragraph
  studentInfo: {
    name?: string;       // leave as empty string or omit
    rollNumber?: string; // leave as empty string or omit
    section?: string;    // leave as empty string or omit
  };
  sections: Array<{
    title: string;        // e.g. "Section A: Multiple Choice Questions"
    instruction?: string; // section-level instructions
    questions: Array<{
      text: string;                             // full question text (min 1 char)
      difficulty: "easy" | "moderate" | "challenging";
      marks: number;                            // positive integer
      answer?: string;                          // model answer for the Answer Key
    }>;  // at least 1 question
  }>;  // at least 1 section
}
\`\`\`

IMPORTANT CONSTRAINTS:
- Do NOT include "schoolName" or "schoolAddress" — these are injected by the server.
- studentInfo fields should all be empty strings (blank fill-in fields for the student).
- \`totalMarks\` MUST exactly equal the sum of every question's \`marks\`.
- \`difficulty\` must be exactly one of: "easy", "moderate", "challenging" (NOT "hard").
- Each question SHOULD include an \`answer\` (model answer) for the Answer Key section.

Assignment requirements:
- Due date: ${input.dueDate}
- Question breakdown (grouped by type into separate sections A, B, C…):
${questionSpecLines}${fileContext}${extraInstructions}

Guidelines:
- Group questions by type into separate named sections (e.g., "Section A: Multiple Choice Questions").
- Each section must have at least one question matching the required count for that type.
- Write clear, unambiguous, academically appropriate question texts.
- Vary difficulty across easy, moderate, and challenging where appropriate.
- Return ONLY the JSON object — no markdown fences, no explanation, no extra text.`;
}
