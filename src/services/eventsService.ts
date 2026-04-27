import { CalendarEvent, CalendarEventInput } from '../types/database';
import { createCrudService } from './createCrudService';

export const eventsService = createCrudService<CalendarEvent, CalendarEventInput>(
  'events',
  {
    orderBy: [{ column: 'start_date', ascending: true }],
  },
);
