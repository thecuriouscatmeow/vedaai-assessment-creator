import type { LlmAdapter } from './index';
import { createGeminiAdapter } from './providers/gemini';
import type { AppConfig } from '../../lib/config';

/**
 * LLM adapter factory.
 *
 * Keyed by the `LLM_PROVIDER` env var (default: 'gemini'). Gemini is the
 * committed, production provider. Claude is a dev-only stub: its module
 * (`./providers/claude`) is gitignored and absent from committed builds, so it
 * is loaded lazily via dynamic import and only resolves when present locally —
 * the committed build never statically depends on it.
 */
export async function createLlmAdapter(config: AppConfig): Promise<LlmAdapter> {
  const provider = config.llmProvider ?? 'gemini';

  switch (provider) {
    case 'gemini':
      return createGeminiAdapter(config.gemini.apiKey);
    case 'claude': {
      try {
        // Variable specifier: keeps the gitignored module out of static
        // resolution so the committed build typechecks without it.
        const claudeModulePath = './providers/claude';
        const { createClaudeAdapter } = await import(claudeModulePath);
        return createClaudeAdapter(''); // API key sourced from env in a full impl
      } catch {
        throw new Error(
          'LLM_PROVIDER="claude" is a dev-only stub and is not present in this build. Use "gemini".',
        );
      }
    }
    default:
      throw new Error(`Unknown LLM_PROVIDER: "${provider}". Supported: gemini, claude.`);
  }
}
