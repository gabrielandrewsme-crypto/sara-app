export type ID = string;

export type Routine = {
  id: ID;
  user_id: ID;
  title: string;
  description: string | null;
  day_of_week: number;
  time: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RoutineInput = {
  title: string;
  description?: string | null;
  day_of_week: number;
  time?: string | null;
  is_active?: boolean;
};

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export type Task = {
  id: ID;
  user_id: ID;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type TaskInput = {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  due_date?: string | null;
  status?: TaskStatus;
};

export type EventType = 'short' | 'medium' | 'long';

export type CalendarEvent = {
  id: ID;
  user_id: ID;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  type: EventType;
  created_at: string;
  updated_at: string;
};

export type CalendarEventInput = {
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  type?: EventType;
};

export type Note = {
  id: ID;
  user_id: ID;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteInput = {
  title?: string | null;
  content?: string | null;
};

export type IdeaType = 'text' | 'mindmap';

export type Idea = {
  id: ID;
  user_id: ID;
  title: string | null;
  content: string | null;
  type: IdeaType;
  created_at: string;
  updated_at: string;
};

export type IdeaInput = {
  title?: string | null;
  content?: string | null;
  type?: IdeaType;
};

export type FinanceType = 'income' | 'expense';

export type Finance = {
  id: ID;
  user_id: ID;
  type: FinanceType;
  amount: number;
  category: string | null;
  date: string;
  recurring: boolean;
  created_at: string;
  updated_at: string;
};

export type FinanceInput = {
  type: FinanceType;
  amount: number;
  category?: string | null;
  date: string;
  recurring?: boolean;
};
