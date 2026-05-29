import { describe, it, expect } from 'vitest';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createChatModel } from './factory';
import type { AppConfig } from '../../lib/config';

const cfg = { llmProvider: 'gemini', gemini: { apiKey: 'k' } } as AppConfig;

describe('createChatModel', () => {
  it('builds a ChatGoogleGenerativeAI for the gemini provider', () => {
    expect(createChatModel(cfg)).toBeInstanceOf(ChatGoogleGenerativeAI);
  });
  it('throws for an unknown provider', () => {
    expect(() => createChatModel({ ...cfg, llmProvider: 'unknown' } as never)).toThrow();
  });
});
