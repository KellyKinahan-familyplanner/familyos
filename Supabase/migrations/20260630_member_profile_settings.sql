-- Add profile/settings columns to family_members
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS points_target      integer,
  ADD COLUMN IF NOT EXISTS reward_description text,
  ADD COLUMN IF NOT EXISTS bedtime            time,
  ADD COLUMN IF NOT EXISTS wake_time          time,
  ADD COLUMN IF NOT EXISTS screen_time_mins   integer,
  ADD COLUMN IF NOT EXISTS avatar_url         text;
