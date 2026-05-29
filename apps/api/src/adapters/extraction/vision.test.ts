import { describe, it, expect, vi } from 'vitest';
import { createVisionExtractor } from './vision';

function fakeModel(content: unknown) {
  return { invoke: vi.fn().mockResolvedValue({ content }) } as never;
}

describe('createVisionExtractor', () => {
  it('returns transcribed text for an image', async () => {
    const extract = createVisionExtractor(fakeModel('Question 1: define force.'));
    const text = await extract(Buffer.from('img-bytes'), 'image/png');
    expect(text).toBe('Question 1: define force.');
  });

  it('flattens array content blocks into a string', async () => {
    const extract = createVisionExtractor(
      fakeModel([{ type: 'text', text: 'part A' }, { type: 'text', text: 'part B' }]),
    );
    const text = await extract(Buffer.from('pdf-bytes'), 'application/pdf');
    expect(text).toContain('part A');
    expect(text).toContain('part B');
  });
});
