import type { AssignmentInput } from '@vedaai/shared';

/**
 * Prompt builder for the LLM generation step.
 *
 * Produces a structured prompt that instructs the model to return a JSON object
 * conforming to the frozen `QuestionPaper` schema. Callers treat the returned
 * string as opaque; only `parsePaper` and the LLM adapter care about the format.
 */
export function buildPrompt(input: AssignmentInput): string {
  const questionSpecLines = input.questions
    .map((q, i) => `  ${i + 1}. ${q.count} question(s) worth ${q.marks} mark(s) each`)
    .join('\n');

  const questionTypes = input.questionTypes.join(', ');

  const fileContext = input.fileUrl
    ? `\nReference material is available at: ${input.fileUrl}. Use it to derive relevant questions.`
    : '';

  const extraInstructions = input.instructions
    ? `\nAdditional instructions from the teacher: ${input.instructions}`
    : '';

  return `You are an expert educator tasked with creating a well-structured exam question paper.

Generate a comprehensive question paper as a JSON object that EXACTLY matches the following TypeScript type (QuestionPaper):

\`\`\`typescript
interface QuestionPaper {
  title: string;          // e.g. "Mid-Term Examination"
  subject: string;        // derive from context or use "General"
  totalMarks: number;     // sum of all question marks (positive integer)
  durationMinutes?: number; // recommended exam duration
  generalInstructions?: string; // overall exam instructions
  studentInfo: {
    name?: string;
    rollNumber?: string;
    className?: string;
    examDate?: string;
  };
  sections: Array<{
    title: string;         // e.g. "Section A: Multiple Choice"
    instruction?: string;  // section-level instructions
    questions: Array<{
      text: string;        // the full question text (min 1 char)
      difficulty: "easy" | "moderate" | "hard";
      marks: number;       // positive integer
    }>;                    // at least 1 question per section
  }>;                      // at least 1 section
}
\`\`\`

Assignment requirements:
- Due date: ${input.dueDate}
- Question types to include: ${questionTypes}
- Question breakdown:
${questionSpecLines}${fileContext}${extraInstructions}

Guidelines:
- Group questions by type into separate sections (e.g., "Section A: MCQ", "Section B: Short Answer").
- Each section must have at least one question.
- Ensure \`totalMarks\` equals the sum of all \`marks\` values across all questions.
- Write clear, unambiguous, academically appropriate question texts.
- Vary difficulty across easy, moderate, and hard where possible.
- Return ONLY the JSON object — no markdown, no explanation, no code fences.`;
}
