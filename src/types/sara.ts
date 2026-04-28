import type {
  EventType,
  FinanceType,
  IdeaType,
  TaskPriority,
  TaskStatus,
} from './database';

export type SaraRole = 'user' | 'assistant';

export type SaraMessage = {
  role: SaraRole;
  content: string;
};

export type SaraChatAction = {
  action: 'chat';
  response: string;
};

export type SaraCreateTaskAction = {
  action: 'create_task';
  data: {
    title: string;
    description?: string | null;
    priority?: TaskPriority;
    due_date?: string | null;
    status?: TaskStatus;
  };
  response: string;
};

export type SaraCreateRoutineAction = {
  action: 'create_routine';
  data: {
    title: string;
    description?: string | null;
    days_of_week?: number[];
    /** Backwards-compat: older prompts may still send a single day. */
    day_of_week?: number;
    time?: string | null;
  };
  response: string;
};

export type SaraCreateEventAction = {
  action: 'create_event';
  data: {
    title: string;
    description?: string | null;
    start_date: string;
    end_date?: string | null;
    type?: EventType;
  };
  response: string;
};

export type SaraCreateNoteAction = {
  action: 'create_note';
  data: {
    title?: string | null;
    content?: string | null;
  };
  response: string;
};

export type SaraCreateIdeaAction = {
  action: 'create_idea';
  data: {
    title?: string | null;
    content?: string | null;
    type?: IdeaType;
  };
  response: string;
};

export type SaraCreateFinanceAction = {
  action: 'create_finance';
  data: {
    type: FinanceType;
    amount: number;
    category?: string | null;
    date?: string;
    recurring?: boolean;
  };
  response: string;
};

export type SaraAction =
  | SaraChatAction
  | SaraCreateTaskAction
  | SaraCreateRoutineAction
  | SaraCreateEventAction
  | SaraCreateNoteAction
  | SaraCreateIdeaAction
  | SaraCreateFinanceAction;

export type DispatchResult = {
  ok: boolean;
  summary?: string;
  error?: string;
};
