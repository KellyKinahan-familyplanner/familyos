-- iCal feed subscriptions per family
create table if not exists calendar_feeds (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid references families(id) on delete cascade not null,
  name         text not null,
  url          text not null,
  colour       text default '#378ADD',
  member_id    uuid references family_members(id) on delete set null,
  last_synced  timestamptz,
  enabled      boolean default true,
  created_at   timestamptz default now()
);

create index if not exists idx_calendar_feeds_family on calendar_feeds (family_id);

alter table calendar_feeds enable row level security;

create policy "family members can read feeds"
  on calendar_feeds for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "family admins can manage feeds"
  on calendar_feeds for all
  using (family_id in (select family_id from family_members where user_id = auth.uid() and role = 'admin'));

-- Track which entries came from a feed so we can re-sync without duplicates
alter table calendar_entries
  add column if not exists source        text default 'manual',
  add column if not exists feed_id       uuid references calendar_feeds(id) on delete cascade,
  add column if not exists feed_uid      text;

create index if not exists idx_calendar_entries_feed on calendar_entries (feed_id, feed_uid);

-- Special event types use existing calendar_entries table
-- types: birthday, school-holiday, family-holiday, public-holiday
-- These are already supported via the `type` column (text, no constraint)
