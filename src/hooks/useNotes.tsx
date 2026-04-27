import { notesService } from '../services/notesService';
import { Note, NoteInput } from '../types/database';
import { createResourceHook } from './createResourceHook';

const { Provider, useResource } = createResourceHook<Note, NoteInput>(notesService);

export const NotesProvider = Provider;
export const useNotes = useResource;
