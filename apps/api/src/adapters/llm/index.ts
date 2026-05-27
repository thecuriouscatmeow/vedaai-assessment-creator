/**
 * LLM adapter contract — the *only* place a vendor LLM SDK may be touched.
 * Implementations (Gemini = default/committed; Claude = dev-only, gitignored)
 * land in Phase 4. The service layer owns prompt-building, parsing, and
 * Zod-validation; the adapter just returns raw completion text.
 */
export interface LlmCompletionRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  /**
   * Optional URL of a file (image or PDF) to attach as inline data alongside
   * the prompt. The Gemini adapter fetches the URL, base64-encodes the bytes,
   * and passes them as `inlineData` parts. Other adapters may ignore this.
   */
  fileUrl?: string;
}

export interface LlmAdapter {
  readonly name: string;
  complete(request: LlmCompletionRequest): Promise<string>;
}
