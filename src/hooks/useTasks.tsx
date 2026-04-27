import { tasksService } from '../services/tasksService';
import { Task, TaskInput } from '../types/database';
import { createResourceHook } from './createResourceHook';

const { Provider, useResource } = createResourceHook<Task, TaskInput>(tasksService);

export const TasksProvider = Provider;
export const useTasks = useResource;
