import { describe, it, expect, vi } from 'vitest';

const extractTextMock = vi.fn();
vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn().mockResolvedValue({}),
  extractText: (...args: unknown[]) => extractTextMock(...args),
}));

import { createPdfExtractor } from './pdf';

describe('createPdfExtractor', () => {
  it('returns native text when the PDF has a real text layer', async () => {
    extractTextMock.mockResolvedValueOnce({ totalPages: 1, text: 'A'.repeat(200) });
    const vision = vi.fn();
    const extract = createPdfExtractor(vision);
    const text = await extract(Buffer.from('pdf'));
    expect(text.length).toBeGreaterThanOrEqual(200);
    expect(vision).not.toHaveBeenCalled();
  });

  it('falls back to vision for a scanned PDF with no text layer', async () => {
    extractTextMock.mockResolvedValueOnce({ totalPages: 1, text: '   ' });
    const vision = vi.fn().mockResolvedValue('vision text');
    const extract = createPdfExtractor(vision);
    const text = await extract(Buffer.from('pdf'));
    expect(text).toBe('vision text');
    expect(vision).toHaveBeenCalledWith(expect.any(Buffer), 'application/pdf');
  });
});
