import { Note, NoteInput } from '../types/database';
import { createCrudService } from './createCrudService';

export const notesService = createCrudService<Note, NoteInput>('notes', {
  orderBy: [{ column: 'updated_at', ascending: false }],
});
