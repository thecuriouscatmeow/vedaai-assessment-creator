import { describe, it, expect, vi, afterEach } from 'vitest';
import { createExtractionAdapter } from './index';

function stubFetch(contentType: string, body = 'bytes') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => contentType },
      arrayBuffer: async () => new TextEncoder().encode(body).buffer,
    }),
  );
}
afterEach(() => vi.unstubAllGlobals());

describe('createExtractionAdapter.extractText', () => {
  const extractPdf = vi.fn().mockResolvedValue('pdf text');
  const extractImage = vi.fn().mockResolvedValue('image text');
  const adapter = createExtractionAdapter({ extractPdf, extractImage });

  it('returns "" when there is no file', async () => {
    expect(await adapter.extractText({ dueDate: '2025-01-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] })).toBe('');
  });

  it('routes a PDF to the native extractor', async () => {
    stubFetch('application/pdf');
    const text = await adapter.extractText({ fileUrl: 'https://x/a.pdf', dueDate: '2025-01-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] });
    expect(text).toBe('pdf text');
    expect(extractImage).not.toHaveBeenCalled();
  });

  it('routes an image to the vision extractor', async () => {
    stubFetch('image/png');
    const text = await adapter.extractText({ fileUrl: 'https://x/a.png', dueDate: '2025-01-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] });
    expect(text).toBe('image text');
  });

  it('throws on a failed fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, headers: { get: () => null } }));
    await expect(adapter.extractText({ fileUrl: 'https://x/a.png', dueDate: '2025-01-01', questions: [{ type: 'mcq', count: 1, marks: 1 }] })).rejects.toThrow(/404/);
  });
});
