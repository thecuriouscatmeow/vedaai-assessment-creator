import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

/**
 * Runtime-configurable model id (DEC-0003); default matches the live deploy.
 * Must be a vision-capable Gemini id: this same model powers vision extraction
 * (images + scanned PDFs), and @langchain/google-genai only enables multimodal
 * input for ids matching gemini-1.5 / gemini-2 / gemini-3 / *vision* / gemma-3-.
 * An override outside that set would make image/scanned-PDF extraction throw
 * before any network call, while text generation would still work.
 */
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

/**
 * The single place the Gemini SDK is constructed. Returns a LangChain chat
 * model used for both vision extraction and structured generation.
 */
export function createGeminiChatModel(apiKey: string): ChatGoogleGenerativeAI {
  return new ChatGoogleGenerativeAI({ apiKey, model: MODEL_NAME, temperature: 0.7 });
}
