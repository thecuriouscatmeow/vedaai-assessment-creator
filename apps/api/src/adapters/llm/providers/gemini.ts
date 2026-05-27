import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LlmAdapter, LlmCompletionRequest } from '../index';

/**
 * Gemini LLM adapter — the default (committed) provider.
 *
 * Uses `@google/generative-ai` with `responseMimeType: application/json` so
 * the model is constrained to structured JSON output. This is the only file
 * that imports the Google SDK; swapping providers never ripples past here.
 */
export function createGeminiAdapter(apiKey: string): LlmAdapter {
  const genAI = new GoogleGenerativeAI(apiKey);

  return {
    name: 'gemini',

    async complete({ prompt, temperature = 0.7 }: LlmCompletionRequest): Promise<string> {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          temperature,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    },
  };
}
