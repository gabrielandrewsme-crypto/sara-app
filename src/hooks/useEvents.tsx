import { eventsService } from '../services/eventsService';
import { CalendarEvent, CalendarEventInput } from '../types/database';
import { createResourceHook } from './createResourceHook';

const { Provider, useResource } = createResourceHook<
  CalendarEvent,
  CalendarEventInput
>(eventsService);

export const EventsProvider = Provider;
export const useEvents = useResource;
