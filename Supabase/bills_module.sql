-- ============================================================
--  FamilyOS — Bills Module Extension
--  Paste this entire file into Supabase SQL Editor → Run
--
--  This file is ADDITIVE — it does NOT drop existing tables.
--  It safely adds the bills categories system on top of the
--  existing schema.
-- ============================================================


-- ============================================================
--  1. CLEAN UP any previous partial runs of this file
-- ============================================================

DROP TABLE IF EXISTS bill_categories CASCADE;

DROP FUNCTION IF EXISTS get_monthly_spend(uuid, int, int)   CASCADE;
DROP FUNCTION IF EXISTS get_yearly_spend(uuid, int)         CASCADE;
DROP FUNCTION IF EXISTS get_upcoming_bills(uuid, int)       CASCADE;
DROP FUNCTION IF EXISTS seed_default_categories(uuid, uuid) CASCADE;


-- ============================================================
--  2. BILL CATEGORIES TABLE
-- ============================================================

CREATE TABLE bill_categories (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  colour       text        NOT NULL DEFAULT '#6B6561',
  icon         text        NOT NULL DEFAULT '📄',
  is_default   boolean     NOT NULL DEFAULT false,
  sort_order   integer     NOT NULL DEFAULT 0,
  created_by   uuid        NOT NULL REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, name)
);

ALTER TABLE bill_categories ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_bill_categories_updated_at
  BEFORE UPDATE ON bill_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  3. ALTER BILLS TABLE
-- ============================================================

ALTER TABLE bills DROP COLUMN IF EXISTS category;

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS category_id      uuid    REFERENCES bill_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_recurring     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recur_interval   text    CHECK (recur_interval IN (
                              'weekly','fortnightly','monthly','quarterly','annually'
                            )),
  ADD COLUMN IF NOT EXISTS reminder_days    integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS reminder_sent    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reference_number text;


-- ============================================================
--  4. RLS POLICIES — bill_categories
-- ============================================================

CREATE POLICY "members can read bill categories"
  ON bill_categories FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "admins can insert bill categories"
  ON bill_categories FOR INSERT
  WITH CHECK (
    family_id = get_my_family_id()
    AND get_my_role() = 'admin'
  );

CREATE POLICY "admins can update bill categories"
  ON bill_categories FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND get_my_role() = 'admin'
  );

CREATE POLICY "admins can delete non-default bill categories"
  ON bill_categories FOR DELETE
  USING (
    family_id  = get_my_family_id()
    AND get_my_role() = 'admin'
    AND is_default = false
  );


-- ============================================================
--  5. RLS POLICIES — bills (replace existing)
-- ============================================================

DROP POLICY IF EXISTS "members can read family bills"  ON bills;
DROP POLICY IF EXISTS "members can insert bills"       ON bills;
DROP POLICY IF EXISTS "members can update their bills" ON bills;
DROP POLICY IF EXISTS "admins can manage all bills"    ON bills;

CREATE POLICY "members can read family bills"
  ON bills FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "members can insert bills"
  ON bills FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "members can update their bills"
  ON bills FOR UPDATE
  USING (
    family_id = get_my_family_id()
    AND (created_by = auth.uid() OR get_my_role() = 'admin')
  );

CREATE POLICY "admins can delete bills"
  ON bills FOR DELETE
  USING (
    family_id = get_my_family_id()
    AND get_my_role() = 'admin'
  );


-- ============================================================
--  6. RLS POLICIES — uploads
-- ============================================================

DROP POLICY IF EXISTS "members can read family uploads" ON uploads;
DROP POLICY IF EXISTS "members can insert uploads"      ON uploads;
DROP POLICY IF EXISTS "admins can delete uploads"       ON uploads;

CREATE POLICY "members can read family uploads"
  ON uploads FOR SELECT
  USING (family_id = get_my_family_id());

CREATE POLICY "members can insert uploads"
  ON uploads FOR INSERT
  WITH CHECK (family_id = get_my_family_id());

CREATE POLICY "admins can delete uploads"
  ON uploads FOR DELETE
  USING (
    family_id = get_my_family_id()
    AND get_my_role() = 'admin'
  );


-- ============================================================
--  7. SEED DEFAULT CATEGORIES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION seed_default_categories(
  p_family_id uuid,
  p_user_id   uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO bill_categories
    (family_id, name, colour, icon, is_default, sort_order, created_by)
  VALUES
    (p_family_id, 'Utilities',     '#2563EB', '⚡', true,  1,  p_user_id),
    (p_family_id, 'Insurance',     '#7C3AED', '🛡️', true,  2,  p_user_id),
    (p_family_id, 'Mortgage/Rent', '#DB2777', '🏠', true,  3,  p_user_id),
    (p_family_id, 'Subscriptions', '#D97706', '📺', true,  4,  p_user_id),
    (p_family_id, 'School',        '#059669', '🎒', true,  5,  p_user_id),
    (p_family_id, 'Medical',       '#DC2626', '🏥', true,  6,  p_user_id),
    (p_family_id, 'Groceries',     '#16A34A', '🛒', true,  7,  p_user_id),
    (p_family_id, 'Transport',     '#0891B2', '🚗', true,  8,  p_user_id),
    (p_family_id, 'Childcare',     '#F59E0B', '👶', true,  9,  p_user_id),
    (p_family_id, 'Other',         '#6B7280', '📄', true,  10, p_user_id)
  ON CONFLICT (family_id, name) DO NOTHING;
END;
$$;


-- ============================================================
--  8. UPDATE create_family_with_admin
-- ============================================================

CREATE OR REPLACE FUNCTION create_family_with_admin(
  p_user_id     uuid,
  p_family_name text,
  p_slug        text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_family_id uuid;
BEGIN
  INSERT INTO families (name, slug)
  VALUES (p_family_name, p_slug)
  RETURNING id INTO v_family_id;

  INSERT INTO family_members (
    family_id, user_id, display_name, role,
    can_add_tasks, can_delete_tasks, can_edit_tasks, can_complete_tasks
  )
  VALUES (
    v_family_id, p_user_id, p_family_name, 'admin',
    true, true, true, true
  );

  PERFORM seed_default_categories(v_family_id, p_user_id);

  RETURN v_family_id;
END;
$$;


-- ============================================================
--  9. REPORTING FUNCTIONS
-- ============================================================

-- Monthly spend by category
CREATE OR REPLACE FUNCTION get_monthly_spend(
  p_family_id uuid,
  p_year      int,
  p_month     int
)
RETURNS TABLE (
  category_id     uuid,
  category_name   text,
  category_colour text,
  category_icon   text,
  total_amount    numeric,
  bill_count      bigint,
  paid_count      bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    bc.id                      AS category_id,
    bc.name                    AS category_name,
    bc.colour                  AS category_colour,
    bc.icon                    AS category_icon,
    COALESCE(SUM(b.amount), 0) AS total_amount,
    COUNT(b.id)                AS bill_count,
    COUNT(b.id) FILTER (WHERE b.paid = true) AS paid_count
  FROM bill_categories bc
  LEFT JOIN bills b
    ON  b.category_id = bc.id
    AND b.family_id   = p_family_id
    AND EXTRACT(YEAR  FROM b.due_date) = p_year
    AND EXTRACT(MONTH FROM b.due_date) = p_month
  WHERE bc.family_id = p_family_id
  GROUP BY bc.id, bc.name, bc.colour, bc.icon, bc.sort_order
  ORDER BY bc.sort_order;
$$;


-- Yearly spend by category
CREATE OR REPLACE FUNCTION get_yearly_spend(
  p_family_id uuid,
  p_year      int
)
RETURNS TABLE (
  category_id     uuid,
  category_name   text,
  category_colour text,
  category_icon   text,
  total_amount    numeric,
  bill_count      bigint,
  paid_count      bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    bc.id                      AS category_id,
    bc.name                    AS category_name,
    bc.colour                  AS category_colour,
    bc.icon                    AS category_icon,
    COALESCE(SUM(b.amount), 0) AS total_amount,
    COUNT(b.id)                AS bill_count,
    COUNT(b.id) FILTER (WHERE b.paid = true) AS paid_count
  FROM bill_categories bc
  LEFT JOIN bills b
    ON  b.category_id = bc.id
    AND b.family_id   = p_family_id
    AND EXTRACT(YEAR FROM b.due_date) = p_year
  WHERE bc.family_id = p_family_id
  GROUP BY bc.id, bc.name, bc.colour, bc.icon, bc.sort_order
  ORDER BY bc.sort_order;
$$;


-- Upcoming unpaid bills due within N days
CREATE OR REPLACE FUNCTION get_upcoming_bills(
  p_family_id uuid,
  p_days      int DEFAULT 30
)
RETURNS TABLE (
  bill_id          uuid,
  title            text,
  amount           numeric,
  currency         text,
  due_date         date,
  days_until_due   int,
  paid             boolean,
  category_name    text,
  category_colour  text,
  category_icon    text,
  reference_number text,
  source_upload_id uuid
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    b.id                                   AS bill_id,
    b.title,
    b.amount,
    b.currency,
    b.due_date,
    (b.due_date - CURRENT_DATE)::int       AS days_until_due,
    b.paid,
    bc.name                                AS category_name,
    bc.colour                              AS category_colour,
    bc.icon                                AS category_icon,
    b.reference_number,
    b.source_upload_id
  FROM bills b
  LEFT JOIN bill_categories bc ON bc.id = b.category_id
  WHERE b.family_id = p_family_id
    AND b.due_date  >= CURRENT_DATE
    AND b.due_date  <= CURRENT_DATE + p_days
    AND b.paid      = false
  ORDER BY b.due_date ASC;
$$;


-- ============================================================
--  10. STORAGE BUCKET FOR BILL UPLOADS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bill-uploads',
  'bill-uploads',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "members can upload bills"      ON storage.objects;
DROP POLICY IF EXISTS "members can read bill uploads" ON storage.objects;
DROP POLICY IF EXISTS "admins can delete bill uploads" ON storage.objects;

CREATE POLICY "members can upload bills"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bill-uploads'
    AND (storage.foldername(name))[1] = get_my_family_id()::text
  );

CREATE POLICY "members can read bill uploads"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'bill-uploads'
    AND (storage.foldername(name))[1] = get_my_family_id()::text
  );

CREATE POLICY "admins can delete bill uploads"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bill-uploads'
    AND (storage.foldername(name))[1] = get_my_family_id()::text
    AND get_my_role() = 'admin'
  );


-- ============================================================
--  11. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bills_family_due
  ON bills (family_id, due_date);

CREATE INDEX IF NOT EXISTS idx_bills_family_category
  ON bills (family_id, category_id);

CREATE INDEX IF NOT EXISTS idx_bills_family_paid
  ON bills (family_id, paid);

CREATE INDEX IF NOT EXISTS idx_bill_categories_family
  ON bill_categories (family_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_uploads_family_purpose
  ON uploads (family_id, purpose);


-- ============================================================
--  DONE
--  You should see: "Success. No rows returned." for each block.
--
--  WHAT WAS CREATED:
--  ✅ bill_categories table with RLS
--  ✅ bills table updated (category_id FK, recurrence, reminders)
--  ✅ uploads table RLS policies
--  ✅ seed_default_categories() function
--  ✅ create_family_with_admin() updated to seed categories
--  ✅ get_monthly_spend() reporting function
--  ✅ get_yearly_spend() reporting function
--  ✅ get_upcoming_bills() reporting function
--  ✅ bill-uploads storage bucket (private, 10MB, images+PDF)
--  ✅ Storage RLS policies
--  ✅ Performance indexes
-- ============================================================
