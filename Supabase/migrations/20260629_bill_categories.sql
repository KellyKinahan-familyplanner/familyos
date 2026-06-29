-- Bill categories per family (admins can add custom ones)
create table if not exists bill_categories (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid references families(id) on delete cascade not null,
  name       text not null,
  colour     text default '#1D9E75',
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_bill_categories_family on bill_categories (family_id);

alter table bill_categories enable row level security;

create policy "family members can read bill categories"
  on bill_categories for select
  using (family_id in (select family_id from family_members where user_id = auth.uid()));

create policy "family admins can manage bill categories"
  on bill_categories for all
  using (family_id in (select family_id from family_members where user_id = auth.uid() and role = 'admin'));

-- Also add bill-specific columns to calendar_entries
alter table calendar_entries
  add column if not exists bill_amount    numeric(10,2),
  add column if not exists bill_category  text,
  add column if not exists bill_status    text default 'upcoming'
    check (bill_status in ('upcoming','paid','overdue'));
