-- ─────────────────────────────────────────────────────────────
-- KYNC: calendar_entries table
-- Stores events, tasks, chores, homework, exams & revision sessions
-- ─────────────────────────────────────────────────────────────

create table if not exists calendar_entries (
  id              uuid primary key default gen_random_uuid(),
  family_id       uuid references families(id) on delete cascade not null,
  created_by      uuid references auth.users(id) on delete set null,

  -- Core fields
  title           text not null,
  date            date not null,
  time_start      time,
  time_end        time,
  type            text not null default 'event'
                    check (type in ('event','task','chore','homework','exam','revision')),
  colour          text default 'green',
  assignees       text[] default array['Everyone'],
  notes           text,

  -- Task / chore extras
  completed       boolean default false,
  points          integer default 0,
  subject         text,

  -- Recurrence
  recur           text default 'none'
                    check (recur in ('none','daily','weekly','monthly')),
  recur_days      text[],            -- weekly: ['Mon','Wed','Fri']
  recur_month_type text,             -- 'date' | 'day'
  recur_month_date integer,          -- e.g. 15
  recur_month_ordinal text,          -- 'First' | 'Last' etc.
  recur_month_day  text,             -- 'Monday' etc.
  recur_end        text default 'never'
                    check (recur_end in ('never','on','after')),
  recur_end_date   date,
  recur_end_count  integer,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Index for fast family lookups
create index if not exists idx_calendar_entries_family
  on calendar_entries (family_id, date);

-- Updated-at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists calendar_entries_updated_at on calendar_entries;
create trigger calendar_entries_updated_at
  before update on calendar_entries
  for each row execute function update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
alter table calendar_entries enable row level security;

-- Read: any authenticated member of the same family
create policy "family members can read entries"
  on calendar_entries for select
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

-- Insert: must belong to the family
create policy "family members can insert entries"
  on calendar_entries for insert
  with check (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

-- Update: same family
create policy "family members can update entries"
  on calendar_entries for update
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );

-- Delete: same family
create policy "family members can delete entries"
  on calendar_entries for delete
  using (
    family_id in (
      select family_id from family_members where user_id = auth.uid()
    )
  );
