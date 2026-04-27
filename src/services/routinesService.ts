import { Routine, RoutineInput } from '../types/database';
import { createCrudService } from './createCrudService';

export const routinesService = createCrudService<Routine, RoutineInput>('routines', {
  orderBy: [
    { column: 'day_of_week', ascending: true },
    { column: 'time', ascending: true, nullsFirst: false },
  ],
});
