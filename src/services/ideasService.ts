import { Idea, IdeaInput } from '../types/database';
import { createCrudService } from './createCrudService';

export const ideasService = createCrudService<Idea, IdeaInput>('ideas', {
  orderBy: [{ column: 'updated_at', ascending: false }],
});
