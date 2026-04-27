import { Task, TaskInput } from '../types/database';
import { createCrudService } from './createCrudService';

export const tasksService = createCrudService<Task, TaskInput>('tasks', {
  orderBy: [
    { column: 'due_date', ascending: true, nullsFirst: false },
    { column: 'created_at', ascending: false },
  ],
});
