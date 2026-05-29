/** Whether an uploaded file is read natively (pdf) or via AI vision (image). */
export type FileKind = 'pdf' | 'image';

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|heic|bmp|tiff?)$/i;

/**
 * Determine how to extract text from a file, preferring the HTTP Content-Type
 * and falling back to the URL extension. Throws on anything we cannot handle so
 * the worker fails the job with a clear message rather than feeding junk to the
 * model.
 */
export function detectFileKind(url: string, contentType: string | null): FileKind {
  const base = contentType?.split(';')[0]?.trim().toLowerCase();
  if (base === 'application/pdf') return 'pdf';
  if (base?.startsWith('image/')) return 'image';

  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (IMAGE_EXT.test(lower)) return 'image';

  throw new Error(
    `Unsupported or undetectable file type for URL "${url}" (content-type: ${base ?? 'none'})`,
  );
}
