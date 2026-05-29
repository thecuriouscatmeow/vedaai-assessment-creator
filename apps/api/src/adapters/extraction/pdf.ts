import { extractText, getDocumentProxy } from 'unpdf';
import type { VisionExtract } from './vision';

/** Below this many non-whitespace chars, treat the PDF as scanned → vision. */
export const MIN_PDF_TEXT_CHARS = 100;

/**
 * Native-first PDF text extraction via unpdf (no AI). If the text layer is
 * empty/too thin (scanned or image-only PDF), fall back to the vision extractor
 * which sends the PDF bytes to Gemini as an application/pdf part.
 */
export function createPdfExtractor(vision: VisionExtract): (bytes: Buffer) => Promise<string> {
  return async (bytes) => {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    const native = Array.isArray(text) ? text.join('\n') : text;

    if (native.replace(/\s/g, '').length >= MIN_PDF_TEXT_CHARS) return native;
    return vision(bytes, 'application/pdf');
  };
}
