import { ideasService } from '../services/ideasService';
import { Idea, IdeaInput } from '../types/database';
import { createResourceHook } from './createResourceHook';

const { Provider, useResource } = createResourceHook<Idea, IdeaInput>(ideasService);

export const IdeasProvider = Provider;
export const useIdeas = useResource;
