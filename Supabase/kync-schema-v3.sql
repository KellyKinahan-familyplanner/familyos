-- ============================================================
--  KYNC — Complete Supabase Schema  (v3)
--  Paste this entire file into Supabase SQL Editor → Run
--  Safe to re-run: drops everything and rebuilds cleanly.
--
--  CHANGELOG v3 (vs v2):
--    + families.onboarding_completed  — tracks AI quick-start wizard status
--    + families.currency              — family-level currency preference (was AUD hardcoded)
--    + task_type CHECK expanded       — added 'revision' alongside existing types
--    + tasks.metadata revision shape  — {"exam_id","subject","duration_minutes","focus_topic"}
--    + Index on tasks(family_id, task_type, due_date) for revision queries
--    + Seed data updated with revision session examples
--    (help content is static/in-app — no DB table needed)
--    (print/export calendar is frontend-only — no DB changes needed)
--
--  EXECUTION ORDER (why this works):
--    1. Extensions
--    2. Drop old objects
--    3. CREATE TABLES (no RLS policies yet — functions don't exist yet)
--    4. CREATE helper functions  ← must exist before policies reference them
--    5. ENABLE RLS + CREATE POLICIES on every table
--    6. Triggers & utility functions
--    7. Indexes
--    8. Stored procedures (create_family_with_admin, accept_invitation)
--    9. Seed data (commented out — uncomment for dev)
-- ============================================================


-- ============================================================
--  1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================
--  2. CLEAN SLATE  (drop in reverse-dependency order)
-- ============================================================

-- Triggers first
DROP TRIGGER IF EXISTS trg_award_chore_points  ON tasks;
DROP TRIGGER IF EXISTS trg_events_updated_at   ON events;
DROP TRIGGER IF EXISTS trg_tasks_updated_at    ON tasks;
DROP TRIGGER IF EXISTS trg_bills_updated_at    ON bills;
DROP TRIGGER IF EXISTS on_auth_user_created    ON auth.users;

-- Functions
DROP FUNCTION IF EXISTS award_chore_points()                     CASCADE;
DROP FUNCTION IF EXISTS set_updated_at()                         CASCADE;
DROP FUNCTION IF EXISTS handle_new_user()                        CASCADE;
DROP FUNCTION IF EXISTS create_family_with_admin(uuid,text,text) CASCADE;
DROP FUNCTION IF EXISTS accept_invitation(text)                  CASCADE;
DROP FUNCTION IF EXISTS get_my_family_id()                       CASCADE;
DROP FUNCTION IF EXISTS get_my_role()                            CASCADE;
DROP FUNCTION IF EXISTS get_my_member_id()                       CASCADE;

-- Tables (children before parents)
DROP TABLE IF EXISTS reminders      CASCADE;
DROP TABLE IF EXISTS uploads        CASCADE;
DROP TABLE IF EXISTS bills          CASCADE;
DROP TABLE IF EXISTS tasks          CASCADE;
DROP TABLE IF EXISTS events         CASCADE;
DROP TABLE IF EXISTS invitations    CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families       CASCADE;


-- ============================================================
--  3. CREATE TABLES  (RLS enabled but NO policies yet)
--     Policies are added in section 5, after helper functions
--     exist in section 4.
-- ============================================================

-- ── families ────────────────────────────────────────────────
--  onboarding_completed: set true when the AI quick-start wizard finishes.
--                        Used to decide whether to show the wizard on first login.
--  currency:             family-level currency code (ISO 4217).
--                        All bills and reports use this — set during onboarding.
CREATE TABLE families (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  slug                 text        NOT NULL UNIQUE,
  currency             text        NOT NULL DEFAULT 'AUD',
  onboarding_completed boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;


-- ── family_members ──────────────────────────────────────────
CREATE TABLE family_members (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id          uuid        NOT NULL REFERENCES families(id)    ON DELETE CASCADE,
  user_id            uuid        NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  display_name       text        NOT NULL,
  avatar_initials    text,
  avatar_colour_bg   text,
  avatar_colour_fg   text,
  role               text        NOT NULL DEFAULT 'member'
                       CHECK (role IN ('admin','member','child','guest')),
  can_add_tasks      boolean     NOT NULL DEFAULT false,
  can_delete_tasks   boolean     NOT NULL DEFAULT false,
  can_edit_tasks     boolean     NOT NULL DEFAULT false,
  can_complete_tasks boolean     NOT NULL DEFAULT true,
  points_total       integer     NOT NULL DEFAULT 0,
  joined_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, user_id)
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;


-- ── invitations ─────────────────────────────────────────────
CREATE TABLE invitations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id          uuid        NOT NULL REFERENCES families(id)   ON DELETE CASCADE,
  invited_by         uuid        NOT NULL REFERENCES auth.users(id),
  email              text        NOT NULL,
  role               text        NOT NULL DEFAULT 'member'
                       CHECK (role IN ('admin','member','child','guest')),
  can_add_tasks      boolean     NOT NULL DEFAULT false,
  can_delete_tasks   boolean     NOT NULL DEFAULT false,
  can_edit_tasks     boolean     NOT NULL DEFAULT false,
  can_complete_tasks boolean     NOT NULL DEFAULT true,
  token              text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32),'hex'),
  accepted           boolean     NOT NULL DEFAULT false,
  expires_at         timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;


-- ── events ──────────────────────────────────────────────────
CREATE TABLE events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        uuid        NOT NULL REFERENCES families(id)        ON DELETE CASCADE,
  created_by       uuid        NOT NULL REFERENCES auth.users(id),
  assigned_to      uuid                 REFERENCES family_members(id),
  title            text        NOT NULL,
  description      text,
  location         text,
  starts_at        timestamptz NOT NULL,
  ends_at          timestamptz,
  all_day          boolean     NOT NULL DEFAULT false,
  colour_override  text,
  source           text                 DEFAULT 'manual'
                     CHECK (source IN ('manual','scanned','imported')),
  source_upload_id uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;


-- ── tasks ───────────────────────────────────────────────────
--  task_type controls which section of the UI the row appears in:
--    'task'     → family task dock on calendar
--    'chore'    → kids AM/PM chore list;   metadata: {"period":"am|pm","points":10}
--    'homework' → kids homework list;      metadata: {"subject":"Maths","subject_code":"sub-math"}
--    'exam'     → kids exam/test list;     metadata: {"subject":"Maths","subject_code":"sub-math","urgency":"soon|mid|ok"}
--    'revision' → study session linked to an exam;
--                                          metadata: {"exam_id":"<uuid>","subject":"Maths","duration_minutes":60,"focus_topic":"Algebra"}
--                 due_date = the date of the revision session (not the exam date)
--                 The parent exam is found via metadata->>'exam_id'
CREATE TABLE tasks (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      uuid        NOT NULL REFERENCES families(id)       ON DELETE CASCADE,
  created_by     uuid        NOT NULL REFERENCES auth.users(id),
  assigned_to    uuid        NOT NULL REFERENCES family_members(id),
  title          text        NOT NULL,
  notes          text,
  due_date       date,
  task_type      text        NOT NULL DEFAULT 'task'
                   CHECK (task_type IN ('task','chore','homework','exam','revision')),
  metadata       jsonb       NOT NULL DEFAULT '{}',
  completed      boolean     NOT NULL DEFAULT false,
  completed_at   timestamptz,
  completed_by   uuid                 REFERENCES auth.users(id),
  is_recurring   boolean     NOT NULL DEFAULT false,
  recur_days     text[],
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;


-- ── bills ───────────────────────────────────────────────────
CREATE TABLE bills (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        uuid          NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by       uuid          NOT NULL REFERENCES auth.users(id),
  title            text          NOT NULL,
  amount           numeric(10,2),
  currency         text          NOT NULL DEFAULT 'AUD',
  due_date         date,
  category         text          CHECK (category IN (
                     'utilities','insurance','mortgage','rent',
                     'subscription','school','medical','other'
                   )),
  paid             boolean       NOT NULL DEFAULT false,
  paid_at          timestamptz,
  paid_by          uuid                   REFERENCES auth.users(id),
  source_upload_id uuid,
  parsed_by_ai     boolean       NOT NULL DEFAULT false,
  ai_confidence    numeric(4,3),
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;


-- ── uploads ─────────────────────────────────────────────────
CREATE TABLE uploads (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid        NOT NULL REFERENCES families(id)   ON DELETE CASCADE,
  uploaded_by  uuid        NOT NULL REFERENCES auth.users(id),
  storage_path text        NOT NULL,
  file_name    text        NOT NULL,
  mime_type    text,
  size_bytes   bigint,
  purpose      text        CHECK (purpose IN ('bill','invitation','avatar','other')),
  processed    boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;


-- ── reminders ───────────────────────────────────────────────
CREATE TABLE reminders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid        NOT NULL REFERENCES families(id)   ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_type   text        NOT NULL CHECK (ref_type IN ('event','task','bill')),
  ref_id     uuid        NOT NULL,
  remind_at  timestamptz NOT NULL,
  sent       boolean     NOT NULL DEFAULT false,
  sent_at    timestamptz,
  channel    text        NOT NULL DEFAULT 'push'
               CHECK (channel IN ('push','email','sms')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;


-- Deferred foreign keys that reference uploads (created after uploads table)
ALTER TABLE events ADD CONSTRAINT events_source_upload_fk
  FOREIGN KEY (source_upload_id) REFERENCES uploads(id) ON DELETE SET NULL;

ALTER TABLE bills ADD CONSTRAINT bills_source_upload_fk
  FOREIGN KEY (source_upload_id) REFERENCES uploads(id) ON DELETE SET NULL;


-- ============================================================
--  4. HELPER FUNCTIONS
--     Must exist BEFORE the RLS policies below reference them.
--     SECURITY DEFINER so they run as the function owner and
--     can read family_members without hitting RLS recursion.
-- ============================================================

-- Returns the family_id of the authenticated user
CREATE OR REPLACE FUNCTION get_my_family_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT family_id
  FROM   family_members
  WHERE  user_id = auth.uid()
  LIMIT  1;
$$;

-- Returns the role of the authenticated user within their family
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM   family_members
  WHERE  user_id    = auth.uid()
    AND  family_id  = get_my_family_id()
  LIMIT  1;
$$;

-- Returns the family_members.id of the authenticated user
CREATE OR REPLACE FUNCTION get_my_member_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id
  FROM   family_members
  WHERE  user_id   = auth.uid()
    AND  family_id = get_my_family_id()
  LIMIT  1;
$$;


-- ============================================================
--  5. ROW LEVEL SECURITY POLICIES
--     Now that the helper functions exist, policies can call them.
-- ============================================================

-- ── families ────────────────────────────────────────────────
CREATE POLICY "members can read their own family"
  ON families FOR SELECT
  USING (id = get_my_family_id());

CREATE POLICY "admins can update family"
  ON families FOR UPDATE
  USING (get_my_role() = 'admin');

-- Allows the create_family_with_admin stored procedure to insert (runs as SECURITY DEFINER)
-- and allows the onboarding wizard to mark onboarding_completed = true via the same proc.
-- No separate policy needed — the stored proc bypasses RLS.


-- ── family_members ──────────────────────────────────────────
CREATE POLICY "members can read all members in their family"
  ON family_members FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "admins can manage members"
  ON family_members FOR ALL
  USING (get_my_role() = 'admin');

CREATE POLICY "members can update their own profile"
  ON family_members FOR UPDATE
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ── invitations ─────────────────────────────────────────────
CREATE POLICY "admins can manage invitations"
  ON invitations FOR ALL
  USING (family_id = get_my_family_id() AND get_my_role() = 'admin');

-- Allow anyone to read an invitation row (token validated inside the function)
CREATE POLICY "anyone can read invitations"
  ON invitations FOR SELECT
  USING (true);


-- ── events ──────────────────────────────────────────────────
CREATE POLICY "members can read family events"
  ON events FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "members can insert events"
  ON events FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "creator or admin can update events"
  ON events FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (created_by = auth.uid() OR get_my_role() = 'admin')
  );

CREATE POLICY "creator or admin can delete events"
  ON events FOR DELETE
  USING (
    family_id = get_my_family_id()
    AND (created_by = auth.uid() OR get_my_role() = 'admin')
  );


-- ── tasks ───────────────────────────────────────────────────
CREATE POLICY "members can read family tasks"
  ON tasks FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "permitted members can add tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    family_id = get_my_family_id()
    AND (
      get_my_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM family_members
        WHERE  user_id    = auth.uid()
          AND  family_id  = get_my_family_id()
          AND  can_add_tasks = true
      )
    )
  );

CREATE POLICY "permitted members can edit tasks"
  ON tasks FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (
      get_my_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM family_members
        WHERE  user_id    = auth.uid()
          AND  family_id  = get_my_family_id()
          AND  can_edit_tasks = true
      )
      -- Children can complete their own assigned tasks
      OR (
        assigned_to = get_my_member_id()
        AND EXISTS (
          SELECT 1 FROM family_members
          WHERE  user_id    = auth.uid()
            AND  family_id  = get_my_family_id()
            AND  can_complete_tasks = true
        )
      )
    )
  );

CREATE POLICY "permitted members can delete tasks"
  ON tasks FOR DELETE
  USING (
    family_id = get_my_family_id()
    AND (
      get_my_role() = 'admin'
      OR EXISTS (
        SELECT 1 FROM family_members
        WHERE  user_id    = auth.uid()
          AND  family_id  = get_my_family_id()
          AND  can_delete_tasks = true
      )
    )
  );


-- ── bills ───────────────────────────────────────────────────
CREATE POLICY "members can read family bills"
  ON bills FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "admins and members can manage bills"
  ON bills FOR ALL
  USING (
    family_id = get_my_family_id()
    AND get_my_role() IN ('admin','member')
  );


-- ── uploads ─────────────────────────────────────────────────
CREATE POLICY "members can manage uploads"
  ON uploads FOR ALL
  USING (family_id = get_my_family_id());


-- ── reminders ───────────────────────────────────────────────
CREATE POLICY "users can manage their own reminders"
  ON reminders FOR ALL
  USING (user_id = auth.uid() AND family_id = get_my_family_id());


-- ============================================================
--  6. TRIGGERS & UTILITY FUNCTIONS
-- ============================================================

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Award / deduct points when a chore is completed / un-completed
CREATE OR REPLACE FUNCTION award_chore_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Chore just completed → add points
  IF NEW.task_type = 'chore'
    AND NEW.completed = true
    AND (OLD.completed = false OR OLD.completed IS NULL)
  THEN
    UPDATE family_members
    SET    points_total = points_total + COALESCE((NEW.metadata->>'points')::int, 0)
    WHERE  id = NEW.assigned_to;
  END IF;

  -- Chore un-completed → deduct points (floor at 0)
  IF NEW.task_type = 'chore'
    AND NEW.completed = false
    AND OLD.completed = true
  THEN
    UPDATE family_members
    SET    points_total = GREATEST(0, points_total - COALESCE((NEW.metadata->>'points')::int, 0))
    WHERE  id = NEW.assigned_to;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_chore_points
  AFTER UPDATE OF completed ON tasks
  FOR EACH ROW EXECUTE FUNCTION award_chore_points();


-- ============================================================
--  7. INDEXES
-- ============================================================

CREATE INDEX idx_events_family_starts  ON events(family_id, starts_at);
CREATE INDEX idx_events_assigned       ON events(assigned_to);
CREATE INDEX idx_tasks_family_type     ON tasks(family_id, task_type);
CREATE INDEX idx_tasks_assigned        ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date        ON tasks(family_id, due_date);
CREATE INDEX idx_tasks_metadata        ON tasks USING gin(metadata);
-- Supports "give me all revision sessions for this exam" lookups via metadata->>'exam_id'
CREATE INDEX idx_tasks_revision_exam   ON tasks((metadata->>'exam_id')) WHERE task_type = 'revision';
CREATE INDEX idx_bills_family_due      ON bills(family_id, due_date);
CREATE INDEX idx_reminders_unsent      ON reminders(remind_at) WHERE sent = false;
CREATE INDEX idx_invitations_token     ON invitations(token);


-- ============================================================
--  8. STORED PROCEDURES
-- ============================================================

-- Called from /api/families/create when a user first sets up KYNC.
-- Creates the family row and adds the caller as admin in one transaction.
-- onboarding_completed is left false here; the AI wizard sets it to true
-- via a separate PATCH /api/families/[id] call when the wizard finishes.
CREATE OR REPLACE FUNCTION create_family_with_admin(
  p_user_id     uuid,
  p_family_name text,
  p_slug        text,
  p_currency    text DEFAULT 'AUD'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_family_id uuid;
BEGIN
  INSERT INTO families (name, slug, currency, onboarding_completed)
  VALUES (p_family_name, p_slug, p_currency, false)
  RETURNING id INTO v_family_id;

  INSERT INTO family_members (
    family_id, user_id, display_name, role,
    can_add_tasks, can_delete_tasks, can_edit_tasks, can_complete_tasks
  )
  VALUES (
    v_family_id, p_user_id, p_family_name || ' Admin', 'admin',
    true, true, true, true
  );

  RETURN v_family_id;
END;
$$;


-- Called from /invite/[token] after the invitee authenticates.
-- Validates the token, checks expiry, creates the member row, marks token used.
CREATE OR REPLACE FUNCTION accept_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inv invitations%ROWTYPE;
  v_uid uuid := auth.uid();
BEGIN
  SELECT * INTO v_inv FROM invitations WHERE token = p_token LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation token');
  END IF;

  IF v_inv.accepted THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation already used');
  END IF;

  IF v_inv.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  IF EXISTS (
    SELECT 1 FROM family_members
    WHERE user_id = v_uid AND family_id = v_inv.family_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this family');
  END IF;

  INSERT INTO family_members (
    family_id, user_id, display_name, role,
    can_add_tasks, can_delete_tasks, can_edit_tasks, can_complete_tasks
  )
  VALUES (
    v_inv.family_id,
    v_uid,
    split_part(v_inv.email, '@', 1),
    v_inv.role,
    v_inv.can_add_tasks,
    v_inv.can_delete_tasks,
    v_inv.can_edit_tasks,
    v_inv.can_complete_tasks
  );

  UPDATE invitations SET accepted = true WHERE id = v_inv.id;

  RETURN jsonb_build_object('success', true, 'family_id', v_inv.family_id);
END;
$$;


-- ============================================================
--  9. SEED DATA
--     Uncomment the block below for local development only.
--     Steps:
--       1. Create 4 users in Supabase Dashboard → Auth → Users
--       2. Replace the 4 placeholder UUIDs below
--       3. Re-run this script
-- ============================================================

/*
DO $$
DECLARE
  v_family_id uuid;
  v_sj_id     uuid;
  v_mj_id     uuid;
  v_oj_id     uuid;
  v_lj_id     uuid;
BEGIN

  INSERT INTO families (id, name, slug, currency, onboarding_completed)
  VALUES ('00000000-0000-0000-0000-000000000001','The Jones Family','jones-family','AUD',true)
  RETURNING id INTO v_family_id;

  INSERT INTO family_members
    (id, family_id, user_id, display_name, avatar_initials,
     avatar_colour_bg, avatar_colour_fg, role,
     can_add_tasks, can_delete_tasks, can_edit_tasks, can_complete_tasks)
  VALUES
    ('00000000-0000-0000-0001-000000000001',
     v_family_id,'<SARAH_USER_ID>','Sarah Jones','SJ','#9FE1CB','#085041',
     'admin',  true,  true,  true,  true),
    ('00000000-0000-0000-0001-000000000002',
     v_family_id,'<MARK_USER_ID>', 'Mark Jones', 'MJ','#F5C4B3','#712B13',
     'member', true,  false, true,  true),
    ('00000000-0000-0000-0001-000000000003',
     v_family_id,'<OLIVIA_USER_ID>','Olivia Jones','OJ','#B5D4F4','#0C447C',
     'child',  false, false, false, true),
    ('00000000-0000-0000-0001-000000000004',
     v_family_id,'<LIAM_USER_ID>',  'Liam Jones', 'LJ','#F4C0D1','#72243E',
     'child',  false, false, false, true);

  SELECT id INTO v_sj_id FROM family_members WHERE avatar_initials='SJ' AND family_id=v_family_id;
  SELECT id INTO v_mj_id FROM family_members WHERE avatar_initials='MJ' AND family_id=v_family_id;
  SELECT id INTO v_oj_id FROM family_members WHERE avatar_initials='OJ' AND family_id=v_family_id;
  SELECT id INTO v_lj_id FROM family_members WHERE avatar_initials='LJ' AND family_id=v_family_id;

  -- Events
  INSERT INTO events (family_id, created_by, assigned_to, title, starts_at, ends_at, all_day)
  VALUES
    (v_family_id,'<SARAH_USER_ID>', NULL,    'Family lunch',         '2025-06-21 13:00+08','2025-06-21 14:00+08',false),
    (v_family_id,'<SARAH_USER_ID>', v_oj_id, 'Swimming lessons',     '2025-06-22 16:00+08','2025-06-22 16:45+08',false),
    (v_family_id,'<SARAH_USER_ID>', v_mj_id, 'Gym — PT session',     '2025-06-22 17:00+08','2025-06-22 18:00+08',false),
    (v_family_id,'<SARAH_USER_ID>', v_sj_id, 'Dentist — Sarah',      '2025-06-23 10:30+08','2025-06-23 11:15+08',false),
    (v_family_id,'<SARAH_USER_ID>', v_lj_id, 'Football training',    '2025-06-24 15:30+08','2025-06-24 17:00+08',false),
    (v_family_id,'<SARAH_USER_ID>', v_oj_id, 'School sports day',    '2025-06-25 08:00+08','2025-06-25 15:00+08',true),
    (v_family_id,'<SARAH_USER_ID>', v_mj_id, 'Work call',            '2025-06-26 09:00+08','2025-06-26 10:00+08',false),
    (v_family_id,'<SARAH_USER_ID>', NULL,    'Dinner at Grandma''s', '2025-06-27 18:00+08','2025-06-27 21:00+08',false);

  -- General tasks
  INSERT INTO tasks (family_id, created_by, assigned_to, title, task_type, due_date)
  VALUES
    (v_family_id,'<SARAH_USER_ID>',v_sj_id,'Pay excursion fee',    'task','2025-06-22'),
    (v_family_id,'<SARAH_USER_ID>',v_mj_id,'Buy sunscreen',        'task','2025-06-22'),
    (v_family_id,'<SARAH_USER_ID>',v_mj_id,'Book car service',     'task','2025-06-25'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Pack sports kit',      'task','2025-06-25'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Return library books', 'task','2025-06-24');

  -- Olivia chores
  INSERT INTO tasks (family_id, created_by, assigned_to, title, task_type, metadata, is_recurring, recur_days)
  VALUES
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Make bed',              'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri','sat','sun']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Get dressed & ready',   'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Pack school bag',        'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Eat breakfast',          'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Unpack school bag',      'chore','{"period":"pm","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Set the table',          'chore','{"period":"pm","points":5}', true,ARRAY['mon','tue','wed','thu','fri','sat','sun']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Feed the dog',           'chore','{"period":"pm","points":10}',true,ARRAY['mon','tue','wed','thu','fri','sat','sun']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Tidy bedroom',           'chore','{"period":"pm","points":10}',true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Shower & ready for bed', 'chore','{"period":"pm","points":5}', true,ARRAY['mon','tue','wed','thu','fri','sat','sun']);

  -- Liam chores
  INSERT INTO tasks (family_id, created_by, assigned_to, title, task_type, metadata, is_recurring, recur_days)
  VALUES
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Make bed',              'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri','sat','sun']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Get dressed & ready',   'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Pack sports bag',        'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Eat breakfast',          'chore','{"period":"am","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Put away school bag',    'chore','{"period":"pm","points":5}', true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Clear dinner plates',    'chore','{"period":"pm","points":5}', true,ARRAY['mon','tue','wed','thu','fri','sat','sun']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Take bins out',          'chore','{"period":"pm","points":15}',false,NULL),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Tidy bedroom',           'chore','{"period":"pm","points":10}',true,ARRAY['mon','tue','wed','thu','fri']),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Shower & ready for bed', 'chore','{"period":"pm","points":5}', true,ARRAY['mon','tue','wed','thu','fri','sat','sun']);

  -- Homework
  INSERT INTO tasks (family_id, created_by, assigned_to, title, task_type, metadata, due_date)
  VALUES
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Chapter 7 worksheet',   'homework','{"subject":"Maths",  "subject_code":"sub-math"}','2025-06-22'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Book report draft',      'homework','{"subject":"English","subject_code":"sub-eng"}', '2025-06-25'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Volcano project notes',  'homework','{"subject":"Science","subject_code":"sub-sci"}', '2025-06-26'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Read 20 pages of novel', 'homework','{"subject":"Reading","subject_code":"sub-read"}','2025-06-22'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Times tables practice',  'homework','{"subject":"Maths",  "subject_code":"sub-math"}','2025-06-24'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Ancient Egypt worksheet','homework','{"subject":"History","subject_code":"sub-hist"}','2025-06-26');

  -- Exams
  INSERT INTO tasks (family_id, created_by, assigned_to, title, task_type, metadata, due_date)
  VALUES
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Maths Test',        'exam','{"subject":"Maths",  "subject_code":"sub-math","urgency":"soon"}','2025-06-25'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'English Essay',      'exam','{"subject":"English","subject_code":"sub-eng", "urgency":"mid"}', '2025-07-02'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Science Exam',       'exam','{"subject":"Science","subject_code":"sub-sci", "urgency":"ok"}',  '2025-07-15'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Spelling Test',      'exam','{"subject":"Spelling","subject_code":"sub-eng","urgency":"mid"}', '2025-06-28'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Reading Assessment', 'exam','{"subject":"Reading","subject_code":"sub-read","urgency":"mid"}', '2025-07-05'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Maths Test',         'exam','{"subject":"Maths",  "subject_code":"sub-math","urgency":"ok"}',  '2025-07-18');

  -- Revision sessions (linked to exams above via metadata->>'exam_id')
  -- In production, exam_id would be the real uuid returned from the exam INSERT.
  -- For seed data we use a placeholder pattern — replace with real UUIDs after seeding.
  --
  -- How it works in the UI:
  --   • Exam card shows countdown + "📚 2 sessions planned" badge
  --   • Revision blocks render as soft lilac events on the calendar
  --   • Priority countdown pills show ⚠️ "No revision scheduled" if none exist
  INSERT INTO tasks (family_id, created_by, assigned_to, title, task_type, metadata, due_date)
  VALUES
    -- Olivia: Maths Test revision (exam due 2025-06-25)
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Maths revision — Number patterns',
     'revision','{"exam_id":"OJ_MATHS_EXAM","subject":"Maths","duration_minutes":45,"focus_topic":"Number patterns"}','2025-06-22'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'Maths revision — Times tables drill',
     'revision','{"exam_id":"OJ_MATHS_EXAM","subject":"Maths","duration_minutes":30,"focus_topic":"Times tables"}','2025-06-24'),

    -- Olivia: English Essay revision (exam due 2025-07-02)
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'English revision — Essay structure',
     'revision','{"exam_id":"OJ_ENG_EXAM","subject":"English","duration_minutes":60,"focus_topic":"Essay structure & intro"}','2025-06-28'),
    (v_family_id,'<SARAH_USER_ID>',v_oj_id,'English revision — Vocabulary & quotes',
     'revision','{"exam_id":"OJ_ENG_EXAM","subject":"English","duration_minutes":45,"focus_topic":"Vocabulary & text quotes"}','2025-06-30'),

    -- Liam: Spelling Test revision (exam due 2025-06-28)
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Spelling practice — List A',
     'revision','{"exam_id":"LJ_SPELL_EXAM","subject":"Spelling","duration_minutes":20,"focus_topic":"List A words"}','2025-06-25'),
    (v_family_id,'<SARAH_USER_ID>',v_lj_id,'Spelling practice — List B + sentences',
     'revision','{"exam_id":"LJ_SPELL_EXAM","subject":"Spelling","duration_minutes":20,"focus_topic":"List B + writing sentences"}','2025-06-27');

  -- Bills
  INSERT INTO bills (family_id, created_by, title, amount, currency, due_date, category)
  VALUES
    (v_family_id,'<SARAH_USER_ID>','Telstra Mobile Plan', 89.00, 'AUD','2025-06-23','utilities'),
    (v_family_id,'<SARAH_USER_ID>','Synergy Energy',     210.50, 'AUD','2025-06-25','utilities'),
    (v_family_id,'<SARAH_USER_ID>','Liam excursion fee',  45.00, 'AUD','2025-06-26','school'),
    (v_family_id,'<SARAH_USER_ID>','Home insurance',     320.00, 'AUD','2025-07-01','insurance'),
    (v_family_id,'<SARAH_USER_ID>','Netflix',             22.99, 'AUD','2025-07-05','subscription');

END;
$$;
*/


-- ============================================================
--  DONE — KYNC Schema v3
--  Every statement above should return:
--  "Success. No rows returned."
--  If you see any errors, check the Supabase logs for details.
--
--  QUICK REFERENCE — key metadata shapes:
--    chore:    {"period":"am|pm","points":10}
--    homework: {"subject":"Maths","subject_code":"sub-math"}
--    exam:     {"subject":"Maths","subject_code":"sub-math","urgency":"soon|mid|ok"}
--    revision: {"exam_id":"<uuid>","subject":"Maths","duration_minutes":60,"focus_topic":"Algebra"}
--
--  ONBOARDING FLOW:
--    1. New user hits /onboarding → AI wizard collects family details
--    2. Wizard calls create_family_with_admin(user_id, name, slug, currency)
--    3. Wizard completes → PATCH families SET onboarding_completed = true
--    4. App checks onboarding_completed on every login; redirects to wizard if false
-- ============================================================
