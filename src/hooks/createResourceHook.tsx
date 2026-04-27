import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CrudService } from '../services/createCrudService';
import { useAuth } from './useAuth';

type WithId = { id: string; user_id: string };

export type ResourceState<T extends WithId, TInput extends Record<string, unknown>> = {
  items: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: TInput) => Promise<T>;
  update: (id: string, patch: Partial<TInput>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => T | undefined;
};

export function createResourceHook<
  T extends WithId,
  TInput extends Record<string, unknown>,
>(service: CrudService<T, TInput>) {
  const Context = createContext<ResourceState<T, TInput> | undefined>(undefined);

  function Provider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
      if (!user) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        const data = await service.getAll(user.id);
        setItems(data);
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? 'Erro ao carregar');
      } finally {
        setLoading(false);
      }
    }, [user]);

    useEffect(() => {
      refresh();
    }, [refresh]);

    const create = useCallback(
      async (input: TInput) => {
        if (!user) throw new Error('Não autenticado');
        const item = await service.create(user.id, input);
        setItems((curr) => [item, ...curr]);
        return item;
      },
      [user],
    );

    const update = useCallback(async (id: string, patch: Partial<TInput>) => {
      const item = await service.update(id, patch);
      setItems((curr) => curr.map((i) => (i.id === id ? item : i)));
      return item;
    }, []);

    const remove = useCallback(async (id: string) => {
      await service.remove(id);
      setItems((curr) => curr.filter((i) => i.id !== id));
    }, []);

    const value = useMemo<ResourceState<T, TInput>>(
      () => ({
        items,
        loading,
        error,
        refresh,
        create,
        update,
        remove,
        getById: (id) => items.find((i) => i.id === id),
      }),
      [items, loading, error, refresh, create, update, remove],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useResource() {
    const ctx = useContext(Context);
    if (!ctx) {
      throw new Error(
        `Resource hook for "${service.table}" must be used inside its Provider`,
      );
    }
    return ctx;
  }

  return { Provider, useResource };
}
