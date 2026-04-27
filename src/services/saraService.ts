import { SaraAction, SaraMessage } from '../types/sara';
import { supabase } from './supabaseClient';

async function readBody(ctx: unknown): Promise<string | null> {
  if (!ctx || typeof ctx !== 'object') return null;
  const maybeResponse = ctx as { text?: () => Promise<string> };
  if (typeof maybeResponse.text !== 'function') return null;
  try {
    return await maybeResponse.text();
  } catch {
    return null;
  }
}

async function unwrapInvokeError(
  error: unknown,
  fallback: string,
): Promise<string> {
  let detail =
    (error as { message?: string })?.message ?? fallback;
  const body = await readBody((error as { context?: unknown }).context);
  if (body) {
    try {
      const json = JSON.parse(body);
      if (typeof json?.error === 'string') {
        detail = json.error;
        if (typeof json.detail === 'string') detail += `: ${json.detail}`;
      } else if (body.length < 300) {
        detail = body;
      }
    } catch {
      if (body.length < 300) detail = body;
    }
  }
  return detail;
}

export const saraService = {
  async chat(messages: SaraMessage[]): Promise<SaraAction> {
    const { data, error } = await supabase.functions.invoke('sara-chat', {
      body: { messages },
    });
    if (error) {
      throw new Error(await unwrapInvokeError(error, 'Erro ao falar com a Sara'));
    }
    if (!data) {
      throw new Error('Resposta vazia da Sara');
    }
    if (typeof data === 'object' && 'error' in data) {
      throw new Error((data as { error: string }).error);
    }
    return data as SaraAction;
  },

  async transcribe(input: {
    audioBase64: string;
    mimeType: string;
    filename: string;
  }): Promise<string> {
    const { data, error } = await supabase.functions.invoke('sara-transcribe', {
      body: { ...input, language: 'pt' },
    });
    if (error) {
      throw new Error(
        await unwrapInvokeError(error, 'Erro ao transcrever áudio'),
      );
    }
    const text = (data as { text?: string } | null)?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Não consegui entender o áudio.');
    }
    return text.trim();
  },
};
