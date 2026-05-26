import { pathToFileURL } from 'node:url';
import { Worker } from 'bullmq';
import type { QuestionPaper } from '@vedaai/shared';
import { buildStubPaper } from './domain/stub-generation';
import { GENERATE_QUEUE, type GenerateJobData } from './lib/queue';

/**
 * Generation worker — stub processor (Phase 2 walking skeleton).
 *
 * `createGenerateProcessor` is the testable unit: it returns a pure async
 * function that simulates work via an injectable delay, then produces a
 * schema-valid stub paper. The `main` bootstrap wires it to a real BullMQ
 * Worker; Phase 4 swaps `buildStubPaper` for the Gemini adapter without
 * touching the worker infrastructure.
 *
 * The worker is a pure processor: it returns a `QuestionPaper` and has no
 * knowledge of Socket.IO. Result delivery to clients is handled by the API
 * process via BullMQ `QueueEvents` in `lib/socket.ts`.
 */

/** Minimal job shape the processor handles. Internal, not exported. */
interface ProcessableJob {
  data: GenerateJobData;
}

export interface ProcessorOptions {
  /** Artificial processing delay in ms. Defaults to 2000. Pass 0 in tests. */
  delayMs?: number;
}

/**
 * Creates a BullMQ-compatible processor function.
 *
 * The returned function accepts a BullMQ `Job`-shaped object so it is
 * independently testable without needing a live queue. Real BullMQ `Worker`
 * construction happens only in `main`.
 */
export function createGenerateProcessor(
  opts: ProcessorOptions = {},
): (job: ProcessableJob) => Promise<QuestionPaper> {
  const { delayMs = 2_000 } = opts;

  return async (job: ProcessableJob): Promise<QuestionPaper> => {
    if (delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }

    return buildStubPaper(job.data.assignmentId);
  };
}

/** Worker bootstrap — runs only when this file is the process entry. */
async function main(): Promise<void> {
  // Lazy imports so unit tests that import only `createGenerateProcessor` never
  // load config/logger/redis (avoids env-var validation in test env).
  const { loadConfig } = await import('./lib/config');
  const { createLogger } = await import('./lib/logger');
  const { createRedisConnection } = await import('./lib/redis');

  const config = loadConfig();
  const logger = createLogger(config);
  const connection = createRedisConnection(config);
  const processor = createGenerateProcessor();

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

  logger.info({ queue: GENERATE_QUEUE }, 'worker: listening for jobs');
}

// Execute bootstrap only when this module is the process entry point.
// `pathToFileURL(process.argv[1])` gives the canonical file URL of the script
// that node/tsx was invoked with, matching `import.meta.url` only when this
// file is run directly — not when it is imported by tests or other modules.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    // eslint-disable-next-line no-console — last-resort crash logging before pino is available
    process.stderr.write(`worker bootstrap failed: ${String(err)}\n`);
    process.exit(1);
  });
}
