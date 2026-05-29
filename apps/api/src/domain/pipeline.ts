import { RunnableLambda } from '@langchain/core/runnables';
import type { AssignmentInput, QuestionPaper, GeneratedPaper } from '@vedaai/shared';
import type { ExtractionAdapter } from '../adapters/extraction/index';
import type { GeneratePaper } from '../adapters/llm/generate';
import { SCHOOL_NAME, SCHOOL_ADDRESS } from '../lib/school';

export interface PipelineDeps {
  extraction: ExtractionAdapter;
  generate: GeneratePaper;
}

export interface GenerationPipeline {
  invoke(input: AssignmentInput): Promise<QuestionPaper>;
}

/**
 * Three named LangChain nodes:
 *   extract  -> { input, sourceText }
 *   generate -> { generated }
 *   merge    -> QuestionPaper (school identity owned by the backend)
 */
export function createPipeline({ extraction, generate }: PipelineDeps): GenerationPipeline {
  const extractNode = RunnableLambda.from(async (input: AssignmentInput) => ({
    input,
    sourceText: await extraction.extractText(input),
  }));

  const generateNode = RunnableLambda.from(
    async (ctx: { input: AssignmentInput; sourceText: string }) => ({
      generated: await generate(ctx),
    }),
  );

  const mergeNode = RunnableLambda.from(
    ({ generated }: { generated: GeneratedPaper }): QuestionPaper => ({
      ...generated,
      schoolName: SCHOOL_NAME,
      schoolAddress: SCHOOL_ADDRESS,
    }),
  );

  const chain = extractNode.pipe(generateNode).pipe(mergeNode);
  return { invoke: (input) => chain.invoke(input) };
}
