import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

/** Runtime-configurable model id (DEC-0003); default matches the live deploy. */
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

/**
 * The single place the Gemini SDK is constructed. Returns a LangChain chat
 * model used for both vision extraction and structured generation.
 */
export function createGeminiChatModel(apiKey: string): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({ apiKey, model: MODEL_NAME, temperature: 0.7 });
}
