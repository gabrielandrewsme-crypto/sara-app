export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Chat: undefined;

  Routines: undefined;
  RoutineForm: { id?: string } | undefined;

  Tasks: undefined;
  TaskForm: { id?: string } | undefined;

  Events: undefined;
  EventForm: { id?: string } | undefined;

  Notes: undefined;
  NoteForm: { id?: string } | undefined;

  Ideas: undefined;
  IdeaForm: { id?: string } | undefined;

  Finances: undefined;
  FinanceForm: { id?: string } | undefined;
};
