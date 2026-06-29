-- Migration: Add child PIN login support
-- Run this in the Supabase SQL Editor

-- 1. Make user_id nullable so children don't need a real auth account
ALTER TABLE family_members
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop the FK constraint that forces user_id to reference auth.users
--    (children have no Supabase auth account)
ALTER TABLE family_members
  DROP CONSTRAINT IF EXISTS family_members_user_id_fkey;

-- 3. Add child_username (e.g. "olivia-jones") for PIN login lookup
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS child_username text;

-- 4. Add pin_hash for storing the child's 4-digit PIN
--    (stored as plain text for this prototype — hash in production)
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS pin_hash text;

-- 5. Unique constraint: one child_username per family
ALTER TABLE family_members
  DROP CONSTRAINT IF EXISTS family_members_child_username_family_unique;

ALTER TABLE family_members
  ADD CONSTRAINT family_members_child_username_family_unique
  UNIQUE (family_id, child_username);

-- 6. Update RLS: allow child login API (service role) to query by slug + child_username + pin
--    The child-login route uses the service role key so RLS is bypassed — no changes needed.

-- Done! Children can now be inserted without a real auth.users entry.
-- Their login flow: family slug → child_username → pin_hash match.
