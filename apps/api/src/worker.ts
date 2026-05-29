import { pathToFileURL } from 'node:url';
import { Worker } from 'bullmq';
import type { QuestionPaper } from '@vedaai/shared';
import type { AssignmentRepository } from './adapters/db/assignment.repository';
import type { GenerationPipeline } from './domain/pipeline';
import { GENERATE_QUEUE, type GenerateJobData } from './lib/queue';

interface ProcessableJob { data: GenerateJobData; }

export interface ProcessorDeps {
  repo: AssignmentRepository;
  pipeline: GenerationPipeline;
}

/**
 * Generation worker. The testable unit loads the assignment, runs the LangChain
 * extract→generate pipeline, and persists the result. On failure it records the
 * error and re-throws so BullMQ QueueEvents emits assignment:failed.
 */
export function createGenerateProcessor(
  deps: ProcessorDeps,
): (job: ProcessableJob) => Promise<QuestionPaper> {
  const { repo, pipeline } = deps;

  return async (job) => {
    const { assignmentId } = job.data;
    const assignment = await repo.findById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found in database`);

    try {
      await repo.setProcessing(assignmentId);
      const paper = await pipeline.invoke(assignment.input);
      await repo.setDone(assignmentId, paper, paper.title);
      return paper;
    } catch (err) {
      await repo.setFailed(assignmentId, err instanceof Error ? err.message : String(err));
      throw err;
    }
  };
}

async function main(): Promise<void> {
  const { loadConfig } = await import('./lib/config');
  const { createLogger } = await import('./lib/logger');
  const { createRedisConnection } = await import('./lib/redis');
  const { createMongooseAdapter } = await import('./adapters/db/mongoose.adapter');
  const { createAssignmentRepository } = await import('./adapters/db/assignment.repository');
  const { createChatModel, createGeneratePaper } = await import('./adapters/llm/index');
  const { createVisionExtractor, createPdfExtractor, createImageExtractor, createExtractionAdapter } =
    await import('./adapters/extraction/index');
  const { createPipeline } = await import('./domain/pipeline');

  const config = loadConfig();
  const logger = createLogger(config);
  const connection = createRedisConnection(config);
  const dbAdapter = createMongooseAdapter(config.mongodbUri, logger);
  await dbAdapter.connect();

  const repo = createAssignmentRepository();
  const model = createChatModel(config);
  const vision = createVisionExtractor(model);
  const extraction = createExtractionAdapter({
    extractPdf: createPdfExtractor(vision),
    extractImage: createImageExtractor(vision),
  });
  const pipeline = createPipeline({ extraction, generate: createGeneratePaper(model) });
  const processor = createGenerateProcessor({ repo, pipeline });

  const worker = new Worker<GenerateJobData, QuestionPaper>(GENERATE_QUEUE, processor, { connection });
  worker.on('active', (job) => logger.info({ jobId: job.id, assignmentId: job.data.assignmentId }, 'worker: job active'));
  worker.on('completed', (job, result) => logger.info({ jobId: job.id, assignmentId: job.data.assignmentId, title: result.title }, 'worker: job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'worker: job failed'));
  logger.info({ queue: GENERATE_QUEUE }, 'worker: listening for jobs');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    process.stderr.write(`worker bootstrap failed: ${String(err)}\n`);
    process.exit(1);
  });
}
