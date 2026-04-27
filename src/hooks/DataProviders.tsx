import React from 'react';
import { EventsProvider } from './useEvents';
import { FinancesProvider } from './useFinances';
import { IdeasProvider } from './useIdeas';
import { NotesProvider } from './useNotes';
import { RoutinesProvider } from './useRoutines';
import { TasksProvider } from './useTasks';

export function DataProviders({ children }: { children: React.ReactNode }) {
  return (
    <RoutinesProvider>
      <TasksProvider>
        <EventsProvider>
          <NotesProvider>
            <IdeasProvider>
              <FinancesProvider>{children}</FinancesProvider>
            </IdeasProvider>
          </NotesProvider>
        </EventsProvider>
      </TasksProvider>
    </RoutinesProvider>
  );
}
