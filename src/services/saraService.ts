import { SaraAction, SaraMessage } from '../types/sara';
import { supabase } from './supabaseClient';

export const saraService = {
  async chat(messages: SaraMessage[]): Promise<SaraAction> {
    const { data, error } = await supabase.functions.invoke('sara-chat', {
      body: { messages },
    });
    if (error) {
      throw new Error(error.message ?? 'Erro ao falar com a Sara');
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
