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

export const saraService = {
  async chat(messages: SaraMessage[]): Promise<SaraAction> {
    const { data, error } = await supabase.functions.invoke('sara-chat', {
      body: { messages },
    });
    if (error) {
      let detail = error.message ?? 'Erro ao falar com a Sara';
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
      throw new Error(detail);
    }
    if (!data) {
      throw new Error('Resposta vazia da Sara');
    }
    if (typeof data === 'object' && 'error' in data) {
      throw new Error((data as { error: string }).error);
    }
    return data as SaraAction;
  },
};
