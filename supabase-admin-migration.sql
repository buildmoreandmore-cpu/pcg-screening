-- PCG Screening — Admin Dashboard Migration
-- Run this in Supabase SQL Editor AFTER the portal migration

-- ============================================
-- ADMIN_USERS TABLE
-- Internal PCG staff who access /admin routes
-- ============================================
create table if not exists admin_users (
  id uuid default gen_random_uuid() primary key,
  auth_user_id uuid unique,
  email text unique not null,
  name text not null,
  role text default 'admin' check (role in ('owner', 'admin')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger admin_users_updated_at
  before update on admin_users
  for each row execute function update_updated_at();

-- ============================================
-- STATUS_HISTORY TABLE
-- Audit log for all candidate status changes
-- ============================================
create table if not exists status_history (
  id uuid default gen_random_uuid() primary key,
  candidate_id uuid references candidates(id) on delete cascade not null,
  previous_status text,
  new_status text not null,
  notes text,
  updated_by text default 'system',
  created_at timestamptz default now()
);

create index idx_status_history_candidate on status_history(candidate_id);
create index idx_status_history_created on status_history(created_at desc);

-- ============================================
-- ADD NEW COLUMNS TO CANDIDATES (if not exist)
-- ============================================
do $$
begin
  -- SSN and DOB for admin view (employer portal never exposes these)
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'dob') then
    alter table candidates add column dob date;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'ssn_last4') then
    alter table candidates add column ssn_last4 text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'address') then
    alter table candidates add column address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'report_url') then
    alter table candidates add column report_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'search_jurisdictions') then
    alter table candidates add column search_jurisdictions jsonb default '[]';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'source') then
    alter table candidates add column source text default 'portal';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'stripe_session_id') then
    alter table candidates add column stripe_session_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'stripe_payment_id') then
    alter table candidates add column stripe_payment_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'dropbox_sign_request_id') then
    alter table candidates add column dropbox_sign_request_id text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'dropbox_sign_signature_id') then
    alter table candidates add column dropbox_sign_signature_id text;
  end if;

  -- Add new columns to clients if missing
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'website') then
    alter table clients add column website text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'address') then
    alter table clients add column address text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'city') then
    alter table clients add column city text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'state') then
    alter table clients add column state text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'clients' and column_name = 'zip') then
    alter table clients add column zip text;
  end if;
end $$;

-- ============================================
-- RLS FOR ADMIN TABLES
-- ============================================
alter table admin_users enable row level security;
alter table status_history enable row level security;

-- Service key bypass for all admin tables
create policy "Service key bypass" on admin_users
  for all using (true) with check (true);

create policy "Service key bypass" on status_history
  for all using (true) with check (true);

-- Admin users can read their own record
create policy "Admin can view own record" on admin_users
  for select using (auth_user_id = auth.uid());

-- Status history viewable by admin and the candidate's employer
create policy "Admins can manage status history" on status_history
  for all using (
    exists (select 1 from admin_users where auth_user_id = auth.uid())
  );

create policy "Employers can view their candidates status history" on status_history
  for select using (
    candidate_id in (
      select c.id from candidates c
      join client_users cu on cu.client_id = c.client_id
      where cu.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- AUTO-LINK AUTH USER FOR ADMINS
-- Update the existing trigger to also handle admin_users
-- ============================================
create or replace function link_auth_user()
returns trigger as $$
begin
  -- Link client users
  update client_users
  set auth_user_id = new.id
  where email = new.email
    and auth_user_id is null;

  -- Link admin users
  update admin_users
  set auth_user_id = new.id
  where email = new.email
    and auth_user_id is null;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- SEED: Gwendolyn as owner
-- ============================================
insert into admin_users (email, name, role)
values ('gwendolyn@pcgscreening.com', 'Gwendolyn Brandon', 'owner')
on conflict (email) do nothing;
