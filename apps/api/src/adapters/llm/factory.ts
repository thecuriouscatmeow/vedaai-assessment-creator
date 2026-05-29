import type { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { AppConfig } from '../../lib/config';
import { createGeminiChatModel } from './providers/gemini';

/**
 * Chat-model factory keyed by config.llmProvider (default: gemini). Gemini is
 * the committed provider; other providers throw until added.
 */
export function createChatModel(config: AppConfig): ChatGoogleGenerativeAI {
  const provider = config.llmProvider ?? 'gemini';
  switch (provider) {
    case 'gemini':
      return createGeminiChatModel(config.gemini.apiKey);
    default:
      throw new Error(`Unsupported LLM_PROVIDER: "${provider}". Supported: gemini.`);
  }
}
