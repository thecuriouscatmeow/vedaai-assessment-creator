import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LlmAdapter, LlmCompletionRequest } from '../index';

const MODEL_NAME = 'gemini-2.0-flash' as const;

/**
 * Gemini LLM adapter — the default (committed) provider.
 *
 * Uses `@google/generative-ai` with `responseMimeType: application/json` so
 * the model is constrained to structured JSON output. This is the only file
 * that imports the Google SDK; swapping providers never ripples past here.
 *
 * When `fileUrl` is provided the adapter fetches the file bytes, determines the
 * MIME type, and passes it to Gemini as `inlineData`. Gemini 2.0 natively reads
 * both images and PDFs, so no separate extraction library is needed.
 *
 * Real-Gemini smoke is deferred (free-tier quota = 0 / HTTP 429). Mocked-LLM
 * tests are the gate for correctness.
 */
export function createGeminiAdapter(apiKey: string): LlmAdapter {
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    name: 'gemini',

    async complete({ prompt, temperature = 0.7, fileUrl }: LlmCompletionRequest): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature,
        },
      });

      // Build content parts — always include the text prompt.
      const parts: Parameters<typeof model.generateContent>[0] extends { contents: infer C }
        ? C extends Array<infer P>
          ? P
          : never
        : never extends never
          ? unknown[]
          : never = [{ text: prompt }] as never;

      // If a file URL is provided, fetch it and attach as inlineData.
      if (fileUrl) {
        const inlinePart = await fetchFileAsInlineData(fileUrl);
        // Attach the file before the text prompt so the model sees the material first.
        (parts as unknown[]).unshift(inlinePart);
      }

      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: parts as never }],
        });
        return result.response.text();
      } catch (err) {
        throw new Error(
          `Gemini generateContent failed (model: ${MODEL_NAME}): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    },
  };
}

/** Fetch a URL and return a Gemini-compatible inlineData part. */
async function fetchFileAsInlineData(
  fileUrl: string,
): Promise<{ inlineData: { mimeType: string; data: string } }> {
  let response: Response;
  try {
    response = await fetch(fileUrl);
  } catch (err) {
    throw new Error(
      `Failed to fetch file for Gemini inlineData (url: ${fileUrl}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch file for Gemini inlineData (url: ${fileUrl}): HTTP ${response.status}`,
    );
  }

  const mimeType = detectMimeType(response.headers.get('content-type'), fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  const data = Buffer.from(arrayBuffer).toString('base64');

  return { inlineData: { mimeType, data } };
}

/** Detect MIME type from the Content-Type header, falling back to the URL extension. */
function detectMimeType(contentType: string | null, fileUrl: string): string {
  if (contentType) {
    // Strip charset and params
    const base = contentType.split(';')[0]?.trim();
    if (base && base !== 'application/octet-stream') return base;
  }

  const lower = fileUrl.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';

  // Default to JPEG for Cloudinary image URLs without an explicit extension
  return 'image/jpeg';
}
