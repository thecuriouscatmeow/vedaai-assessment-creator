import type { AssignmentInput } from '@vedaai/shared';
import { detectFileKind, type FileKind } from './detect';

export type { FileKind } from './detect';
export { detectFileKind } from './detect';
export { createVisionExtractor, type VisionExtract } from './vision';
export { createPdfExtractor, MIN_PDF_TEXT_CHARS } from './pdf';
export { createImageExtractor } from './image';

/** Turns an assignment's uploaded file into plain source text (or '' if none). */
export interface ExtractionAdapter {
  extractText(input: AssignmentInput): Promise<string>;
}

export interface ExtractionDeps {
  extractPdf: (bytes: Buffer) => Promise<string>;
  extractImage: (bytes: Buffer, mimeType: string) => Promise<string>;
}

export function createExtractionAdapter({ extractPdf, extractImage }: ExtractionDeps): ExtractionAdapter {
  return {
    async extractText(input) {
      if (!input.fileUrl) return '';
      const { bytes, mimeType, kind } = await fetchFile(input.fileUrl);
      return kind === 'pdf' ? extractPdf(bytes) : extractImage(bytes, mimeType);
    },
  };
}

async function fetchFile(
  url: string,
): Promise<{ bytes: Buffer; mimeType: string; kind: FileKind }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch upload (${url}): HTTP ${res.status}`);
  const contentType = res.headers.get('content-type');
  const kind = detectFileKind(url, contentType);
  const bytes = Buffer.from(await res.arrayBuffer());
  const mimeType = contentType?.split(';')[0]?.trim() || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg');
  return { bytes, mimeType, kind };
}
