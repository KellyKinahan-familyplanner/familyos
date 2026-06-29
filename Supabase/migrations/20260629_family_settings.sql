-- Add bedtime and notification settings to families table
alter table families
  add column if not exists bedtime_enabled  boolean default false,
  add column if not exists bedtime_start    time    default '20:30',
  add column if not exists bedtime_end      time    default '07:00',
  add column if not exists notifications_enabled boolean default true,
  add column if not exists timezone         text    default 'Australia/Sydney';
