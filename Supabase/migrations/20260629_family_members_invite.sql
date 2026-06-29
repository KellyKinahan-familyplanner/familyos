-- Add invite tracking columns to family_members
alter table family_members
  add column if not exists invite_email  text,
  add column if not exists invite_status text default 'accepted'
    check (invite_status in ('pending','accepted'));
