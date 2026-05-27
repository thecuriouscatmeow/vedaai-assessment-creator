import { QuestionPaperSchema, type QuestionPaper } from '@vedaai/shared';
import type { LlmAdapter } from '../adapters/llm/index';

/**
 * Parse + validate the LLM's raw text output into a schema-valid QuestionPaper.
 *
 * Strategy:
 *  1. Attempt to JSON.parse the raw string and Zod-validate it.
 *  2. On any failure (parse error or schema violation), perform EXACTLY ONE
 *     repair-retry: re-prompt the LLM with the validation error message, then
 *     attempt parse+validate again.
 *  3. If the retry also fails, throw — the worker will mark the job as failed.
 *
 * The LLM adapter is only called for the repair step; a valid first response
 * never triggers a completion request.
 */
export async function parsePaper(raw: string, llm: LlmAdapter): Promise<QuestionPaper> {
  const firstAttempt = tryParse(raw);
  if (firstAttempt.success) {
    return firstAttempt.data;
  }

  // Repair-retry: give the LLM the validation error + ask it to fix the JSON
  const repairPrompt = buildRepairPrompt(raw, firstAttempt.error);
  const repaired = await llm.complete({ prompt: repairPrompt });

  const secondAttempt = tryParse(repaired);
  if (secondAttempt.success) {
    return secondAttempt.data;
  }

  throw new Error(
    `LLM output failed schema validation after one repair-retry: ${secondAttempt.error}`,
  );
}

/** Parse result discriminated union to avoid exception-based control flow. */
type ParseResult =
  | { success: true; data: QuestionPaper }
  | { success: false; error: string };

function tryParse(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { success: false, error: `JSON parse failed: ${String(e)}` };
  }

  const result = QuestionPaperSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return { success: false, error: `Schema validation failed — ${issues}` };
  }

  return { success: true, data: result.data };
}

function buildRepairPrompt(originalRaw: string, errorMessage: string): string {
  return `The JSON you produced failed validation with this error:
${errorMessage}

Original (invalid) response:
${originalRaw}

Please produce a corrected JSON object that EXACTLY matches the QuestionPaper schema:
- title: string (min 1 char)
- subject: string (min 1 char)
- totalMarks: positive integer (must equal sum of all question marks)
- durationMinutes?: positive integer (optional)
- generalInstructions?: string (optional)
- studentInfo: object (name?, rollNumber?, className?, examDate? — all optional strings)
- sections: array of at least 1 section, each with:
  - title: string (min 1 char)
  - instruction?: string (optional)
  - questions: array of at least 1 question, each with:
    - text: string (min 1 char)
    - difficulty: "easy" | "moderate" | "hard"
    - marks: positive integer

Return ONLY the corrected JSON object — no markdown, no explanation, no code fences.`;
}
