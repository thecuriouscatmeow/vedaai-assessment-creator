import type { VisionExtract } from './vision';

/** Image text extraction is a thin wrapper over the shared vision extractor. */
export function createImageExtractor(
  vision: VisionExtract,
): (bytes: Buffer, mimeType: string) => Promise<string> {
  return (bytes, mimeType) => vision(bytes, mimeType);
}
