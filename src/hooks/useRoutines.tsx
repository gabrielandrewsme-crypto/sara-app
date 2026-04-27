import { routinesService } from '../services/routinesService';
import { Routine, RoutineInput } from '../types/database';
import { createResourceHook } from './createResourceHook';

const { Provider, useResource } = createResourceHook<Routine, RoutineInput>(
  routinesService,
);

export const RoutinesProvider = Provider;
export const useRoutines = useResource;
