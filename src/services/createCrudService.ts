import { supabase } from './supabaseClient';

type WithId = { id: string; user_id: string };

type OrderSpec = { column: string; ascending: boolean; nullsFirst?: boolean };

type Options = {
  orderBy?: OrderSpec[];
};

export type CrudService<T extends WithId, TInput extends Record<string, unknown>> = {
  table: string;
  getAll(userId: string): Promise<T[]>;
  create(userId: string, input: TInput): Promise<T>;
  update(id: string, patch: Partial<TInput>): Promise<T>;
  remove(id: string): Promise<void>;
};

export function createCrudService<
  T extends WithId,
  TInput extends Record<string, unknown>,
>(table: string, options: Options = {}): CrudService<T, TInput> {
  return {
    table,
    async getAll(userId: string) {
      let query = supabase.from(table).select('*').eq('user_id', userId);
      for (const o of options.orderBy ?? []) {
        query = query.order(o.column, {
          ascending: o.ascending,
          nullsFirst: o.nullsFirst,
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as T[];
    },
    async create(userId: string, input: TInput) {
      const { data, error } = await supabase
        .from(table)
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    async update(id: string, patch: Partial<TInput>) {
      const { data, error } = await supabase
        .from(table)
        .update(patch as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    async remove(id: string) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
  };
}
