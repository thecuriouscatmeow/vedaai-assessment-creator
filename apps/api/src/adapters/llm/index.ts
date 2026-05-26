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
}

export interface LlmAdapter {
  readonly name: string;
  complete(request: LlmCompletionRequest): Promise<string>;
}
