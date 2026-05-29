import { HumanMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MessageContent } from '@langchain/core/messages';

/** Extract plain text from raw file bytes using a vision-capable chat model. */
export type VisionExtract = (bytes: Buffer, mimeType: string) => Promise<string>;

const VISION_PROMPT =
  'Transcribe ALL text from this document verbatim, and briefly describe any diagrams, ' +
  'figures, or tables. Output plain text only — no commentary, no markdown.';

/**
 * Build a VisionExtract bound to a chat model. Bytes are sent as a base64
 * data-URL content part; Gemini accepts both image/* and application/pdf, so
 * this single routine serves image extraction and the scanned-PDF fallback.
 */
export function createVisionExtractor(model: BaseChatModel): VisionExtract {
  return async (bytes, mimeType) => {
    const dataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;
    const message = new HumanMessage({
      content: [
        { type: 'text', text: VISION_PROMPT },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    });
    const res = await model.invoke([message]);
    return flattenContent(res.content as MessageContent);
  };
}

function flattenContent(content: MessageContent): string {
  if (typeof content === 'string') return content;
  return content
    .map((block) => {
      if (typeof block === 'string') return block;
      const b = block as unknown as Record<string, unknown>;
      if ('text' in b && typeof b['text'] === 'string') return b['text'];
      return '';
    })
    .join('\n')
    .trim();
}
