import type { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { GeneratedPaperSchema, type GeneratedPaper, type AssignmentInput } from '@vedaai/shared';
import { buildPrompt } from '../../domain/prompt';

/** Generate a validated academic paper from form specs + extracted source text. */
export type GeneratePaper = (args: {
  input: AssignmentInput;
  sourceText: string;
}) => Promise<GeneratedPaper>;

/**
 * Bind a generation function to a chat model. Uses LangChain structured output
 * (the model is constrained to GeneratedPaperSchema) with one retry, then ALWAYS
 * re-validates with our own Zod schema — the model never returns raw text.
 */
export function createGeneratePaper(model: ChatGoogleGenerativeAI): GeneratePaper {
  const chain = model
    .withStructuredOutput(GeneratedPaperSchema, { name: 'question_paper' })
    .withRetry({ stopAfterAttempt: 2 });

  return async ({ input, sourceText }) => {
    const result = await chain.invoke(buildPrompt(input, sourceText));
    return GeneratedPaperSchema.parse(result);
  };
}
