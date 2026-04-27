-- =====================================================
-- Sara — initial schema
-- Tables: routines, tasks, events, notes, ideas, finances
-- Every table: per-user ownership via auth.users, RLS enforced,
-- updated_at kept fresh by trigger.
-- =====================================================

-- Shared trigger function: refresh updated_at on every UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =====================================================
-- routines
-- =====================================================
create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  day_of_week integer not null check (day_of_week between 0 and 6),
  time        time,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines(user_id);

create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

alter table public.routines enable row level security;

create policy "routines: select own" on public.routines
  for select using (auth.uid() = user_id);
create policy "routines: insert own" on public.routines
  for insert with check (auth.uid() = user_id);
create policy "routines: update own" on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines: delete own" on public.routines
  for delete using (auth.uid() = user_id);


-- =====================================================
-- tasks
-- =====================================================
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  due_date    timestamp,
  status      text not null default 'pending' check (status in ('pending','in_progress','done')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_id_idx  on public.tasks(user_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy "tasks: select own" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks: insert own" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks: update own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks: delete own" on public.tasks
  for delete using (auth.uid() = user_id);


-- =====================================================
-- events
-- =====================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  start_date  timestamp not null,
  end_date    timestamp,
  type        text not null default 'short' check (type in ('short','medium','long')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists events_user_id_idx    on public.events(user_id);
create index if not exists events_start_date_idx on public.events(start_date);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "events: select own" on public.events
  for select using (auth.uid() = user_id);
create policy "events: insert own" on public.events
  for insert with check (auth.uid() = user_id);
create policy "events: update own" on public.events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "events: delete own" on public.events
  for delete using (auth.uid() = user_id);


-- =====================================================
-- notes
-- =====================================================
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  content    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes(user_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

create policy "notes: select own" on public.notes
  for select using (auth.uid() = user_id);
create policy "notes: insert own" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "notes: update own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes: delete own" on public.notes
  for delete using (auth.uid() = user_id);


-- =====================================================
-- ideas
-- =====================================================
create table if not exists public.ideas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  content    text,
  type       text not null default 'text' check (type in ('text','mindmap')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_user_id_idx on public.ideas(user_id);

create trigger ideas_set_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();

alter table public.ideas enable row level security;

create policy "ideas: select own" on public.ideas
  for select using (auth.uid() = user_id);
create policy "ideas: insert own" on public.ideas
  for insert with check (auth.uid() = user_id);
create policy "ideas: update own" on public.ideas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ideas: delete own" on public.ideas
  for delete using (auth.uid() = user_id);


-- =====================================================
-- finances
-- =====================================================
create table if not exists public.finances (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('income','expense')),
  amount     numeric(14,2) not null,
  category   text,
  date       timestamp not null default now(),
  recurring  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finances_user_id_idx on public.finances(user_id);
create index if not exists finances_date_idx    on public.finances(date);

create trigger finances_set_updated_at
  before update on public.finances
  for each row execute function public.set_updated_at();

alter table public.finances enable row level security;

create policy "finances: select own" on public.finances
  for select using (auth.uid() = user_id);
create policy "finances: insert own" on public.finances
  for insert with check (auth.uid() = user_id);
create policy "finances: update own" on public.finances
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "finances: delete own" on public.finances
  for delete using (auth.uid() = user_id);
