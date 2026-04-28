import { useCallback } from 'react';
import { DispatchResult, SaraAction } from '../types/sara';
import { useEvents } from './useEvents';
import { useFinances } from './useFinances';
import { useIdeas } from './useIdeas';
import { useNotes } from './useNotes';
import { useRoutines } from './useRoutines';
import { useTasks } from './useTasks';

export function useSaraDispatcher() {
  const tasks = useTasks();
  const routines = useRoutines();
  const events = useEvents();
  const notes = useNotes();
  const ideas = useIdeas();
  const finances = useFinances();

  return useCallback(
    async (action: SaraAction): Promise<DispatchResult> => {
      try {
        switch (action.action) {
          case 'chat':
            return { ok: true };

          case 'create_task': {
            const item = await tasks.create({
              title: action.data.title,
              description: action.data.description ?? null,
              priority: action.data.priority ?? 'medium',
              due_date: action.data.due_date ?? null,
              status: action.data.status ?? 'pending',
            });
            return { ok: true, summary: `Tarefa criada: ${item.title}` };
          }

          case 'create_routine': {
            const days = (() => {
              const arr = action.data.days_of_week;
              if (Array.isArray(arr) && arr.length > 0) {
                return arr.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
              }
              if (typeof action.data.day_of_week === 'number') {
                return [action.data.day_of_week];
              }
              return [0, 1, 2, 3, 4, 5, 6];
            })();
            if (days.length === 0) {
              return { ok: false, error: 'Nenhum dia válido informado' };
            }
            let firstTitle = '';
            for (const day of days) {
              const item = await routines.create({
                title: action.data.title,
                description: action.data.description ?? null,
                day_of_week: day,
                time: action.data.time ?? null,
                is_active: true,
              });
              if (!firstTitle) firstTitle = item.title;
            }
            const dayWord = days.length === 1 ? 'dia' : 'dias';
            return {
              ok: true,
              summary: `Rotina criada: ${firstTitle} (${days.length} ${dayWord})`,
            };
          }

          case 'create_event': {
            const item = await events.create({
              title: action.data.title,
              description: action.data.description ?? null,
              start_date: action.data.start_date,
              end_date: action.data.end_date ?? null,
              type: action.data.type ?? 'short',
            });
            return { ok: true, summary: `Evento criado: ${item.title}` };
          }

          case 'create_note': {
            const item = await notes.create({
              title: action.data.title ?? null,
              content: action.data.content ?? null,
            });
            return {
              ok: true,
              summary: `Nota salva${item.title ? `: ${item.title}` : ''}`,
            };
          }

          case 'create_idea': {
            const item = await ideas.create({
              title: action.data.title ?? null,
              content: action.data.content ?? null,
              type: action.data.type ?? 'text',
            });
            return {
              ok: true,
              summary: `Ideia salva${item.title ? `: ${item.title}` : ''}`,
            };
          }

          case 'create_finance': {
            const item = await finances.create({
              type: action.data.type,
              amount: action.data.amount,
              category: action.data.category ?? null,
              date: action.data.date ?? new Date().toISOString(),
              recurring: action.data.recurring ?? false,
            });
            const label = item.type === 'income' ? 'Entrada' : 'Saída';
            return {
              ok: true,
              summary: `${label} registrada: R$ ${Number(item.amount).toFixed(2)}`,
            };
          }

          default: {
            const _exhaustive: never = action;
            return { ok: false, error: 'Ação desconhecida' };
          }
        }
      } catch (e: any) {
        return { ok: false, error: e?.message ?? 'Falha ao executar ação' };
      }
    },
    [tasks, routines, events, notes, ideas, finances],
  );
}
