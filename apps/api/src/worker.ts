import { pathToFileURL } from 'node:url';
import { Worker } from 'bullmq';
import type { QuestionPaper } from '@vedaai/shared';
import type { AssignmentRepository } from './adapters/db/assignment.repository';
import type { LlmAdapter } from './adapters/llm/index';
import { buildPrompt } from './domain/prompt';
import { parsePaper } from './domain/parse';
import { GENERATE_QUEUE, type GenerateJobData } from './lib/queue';
import { SCHOOL_ADDRESS, SCHOOL_NAME } from './lib/school';

/**
 * Generation worker — real Gemini-backed processor (Phase 4).
 *
 * `createGenerateProcessor` is the testable unit: an async function that:
 *   1. Loads the assignment from the DB.
 *   2. Sets status → processing.
 *   3. Builds the LLM prompt from the stored input.
 *   4. Calls the LLM adapter (with optional inlineData file attachment).
 *   5. Injects school identity (schoolName, schoolAddress) into the raw JSON
 *      before parse so the full QuestionPaperSchema can validate.
 *   6. Parses + validates the response (with one repair-retry).
 *   7. Persists status → done + paper + title.
 *   8. Returns the paper (QueueEvents emits assignment:done from the API process).
 *
 * On any failure the processor sets status → failed + error, then re-throws so
 * BullMQ marks the job as failed and QueueEvents emits assignment:failed.
 *
 * The worker is provider-agnostic: it accepts an `LlmAdapter` interface so
 * tests inject a mock without touching Gemini.
 */

/** Minimal job shape the processor handles. */
interface ProcessableJob {
  data: GenerateJobData;
}

export interface ProcessorDeps {
  repo: AssignmentRepository;
  llm: LlmAdapter;
}

/**
 * Creates a BullMQ-compatible processor function.
 *
 * Accepts `ProcessorDeps` to keep the processor independently testable — no
 * real Redis or Gemini connection needed in unit/integration tests.
 */
export function createGenerateProcessor(
  deps: ProcessorDeps,
): (job: ProcessableJob) => Promise<QuestionPaper> {
  const { repo, llm } = deps;

  return async (job: ProcessableJob): Promise<QuestionPaper> => {
    const { assignmentId } = job.data;

    const assignment = await repo.findById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found in database`);
    }

    try {
      await repo.setProcessing(assignmentId);

      const prompt = buildPrompt(assignment.input);

      // Pass the fileUrl through so the Gemini adapter can attach it as
      // inlineData (image or PDF). Other adapters ignore unknown fields.
      const rawOutput = await llm.complete({
        prompt,
        fileUrl: assignment.input.fileUrl,
      });

      // Inject school identity into the raw JSON string before validation.
      // This avoids the LLM needing to know the school — it generates the
      // academic fields; we own the institutional branding.
      const injectedRaw = injectSchoolIdentity(rawOutput);

      const paper = await parsePaper(injectedRaw, llm);
      const title = paper.title;

      await repo.setDone(assignmentId, paper, title);
      return paper;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await repo.setFailed(assignmentId, errorMessage);
      throw err;
    }
  };
}

/**
 * Inject `schoolName` and `schoolAddress` into the raw LLM JSON string.
 *
 * The model generates everything except school identity. We merge these fields
 * before Zod-parsing so the full `QuestionPaperSchema` (which requires
 * `schoolName`) validates successfully.
 *
 * Throws if the raw string is not parseable JSON — the caller's try/catch will
 * propagate this to `repo.setFailed`.
 */
function injectSchoolIdentity(rawJson: string): string {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawJson) as Record<string, unknown>;
  } catch (err) {
    // Let parsePaper's JSON parse error surface cleanly; return the raw string
    // so parsePaper can report the proper error.
    return rawJson;
  }

  parsed['schoolName'] = SCHOOL_NAME;
  parsed['schoolAddress'] = SCHOOL_ADDRESS;

  return JSON.stringify(parsed);
}

/** Worker bootstrap — runs only when this file is the process entry. */
async function main(): Promise<void> {
  // Lazy imports so unit tests that import only `createGenerateProcessor` never
  // load config/logger/redis (avoids env-var validation in test env).
  const { loadConfig } = await import('./lib/config');
  const { createLogger } = await import('./lib/logger');
  const { createRedisConnection } = await import('./lib/redis');
  const { createMongooseAdapter } = await import('./adapters/db/mongoose.adapter');
  const { createAssignmentRepository } = await import('./adapters/db/assignment.repository');
  const { createLlmAdapter } = await import('./adapters/llm/factory');

  const config = loadConfig();
  const logger = createLogger(config);
  const connection = createRedisConnection(config);
  const dbAdapter = createMongooseAdapter(config.mongodbUri, logger);

  await dbAdapter.connect();

  const repo = createAssignmentRepository();
  const llm = await createLlmAdapter(config);
  const processor = createGenerateProcessor({ repo, llm });

  const worker = new Worker<GenerateJobData, QuestionPaper>(GENERATE_QUEUE, processor, {
    connection,
  });

  worker.on('active', (job) => {
    logger.info({ jobId: job.id, assignmentId: job.data.assignmentId }, 'worker: job active');
  });

  worker.on('completed', (job, result) => {
    logger.info(
      { jobId: job.id, assignmentId: job.data.assignmentId, title: result.title },
      'worker: job completed',
    );
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'worker: job failed');
  });

  logger.info({ queue: GENERATE_QUEUE, provider: llm.name }, 'worker: listening for jobs');
}

// Execute bootstrap only when this module is the process entry point.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    // eslint-disable-next-line no-console — last-resort crash logging before pino is available
    process.stderr.write(`worker bootstrap failed: ${String(err)}\n`);
    process.exit(1);
  });
}
