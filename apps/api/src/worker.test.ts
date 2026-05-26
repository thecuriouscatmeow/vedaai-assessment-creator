import { describe, it, expect } from 'vitest';
import { QuestionPaperSchema } from '@vedaai/shared';
import { createGenerateProcessor } from './worker';

/**
 * Unit tests for the generate worker processor.
 *
 * `delayMs: 0` makes the tests synchronous in effect; no live Redis or
 * BullMQ Worker is constructed. The processor is exercised as a plain
 * async function.
 */

describe('createGenerateProcessor', () => {
  it('resolves a result that satisfies the frozen QuestionPaper schema', async () => {
    const processor = createGenerateProcessor({ delayMs: 0 });
    const result = await processor({ data: { assignmentId: 'test-id-abc' } });

    expect(() => QuestionPaperSchema.parse(result)).not.toThrow();
  });

  it('embeds the assignmentId in the paper title (round-trip verifiable)', async () => {
    const processor = createGenerateProcessor({ delayMs: 0 });
    const assignmentId = 'verify-round-trip-id';

    const result = await processor({ data: { assignmentId } });

    expect(result.title).toContain(assignmentId);
  });

  it('produces a paper for any given assignmentId', async () => {
    const processor = createGenerateProcessor({ delayMs: 0 });

    const a = await processor({ data: { assignmentId: 'id-one' } });
    const b = await processor({ data: { assignmentId: 'id-two' } });

    expect(a.title).not.toBe(b.title);
    expect(() => QuestionPaperSchema.parse(a)).not.toThrow();
    expect(() => QuestionPaperSchema.parse(b)).not.toThrow();
  });
});
