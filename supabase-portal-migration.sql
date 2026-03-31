-- PCG Screening — Employer Portal Migration
-- Run this in Supabase SQL Editor AFTER the initial schema

-- ============================================
-- CLIENTS TABLE
-- Each employer company that uses PCG screening
-- ============================================
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  logo_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  packages jsonb not null default '[]',
  -- format: [{"name": "Basic Background Check", "price": 29, "description": "...", "features": [...]}]
  notification_email text,
  fcra_accepted_at timestamptz,  -- NULL = not yet accepted
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

-- ============================================
-- CLIENT_USERS TABLE
-- Users who can log into an employer's portal
-- ============================================
create table if not exists client_users (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  auth_user_id uuid unique,  -- links to auth.users after first login
  email text not null,
  name text not null,
  role text default 'admin' check (role in ('admin', 'user')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, email)
);

create trigger client_users_updated_at
  before update on client_users
  for each row execute function update_updated_at();

-- ============================================
-- CANDIDATES TABLE
-- Each candidate screening submitted by an employer
-- No SSN, DOB, or full address — those stay on submissions only
-- ============================================
create table if not exists candidates (
  id uuid default gen_random_uuid() primary key,
  tracking_code text unique not null,
  client_id uuid references clients(id) on delete cascade not null,
  client_slug text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  package_name text not null,
  package_price numeric not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  consent_status text default 'pending' check (consent_status in ('pending', 'signed')),
  status text default 'submitted' check (status in ('submitted', 'in_progress', 'completed', 'cancelled')),
  status_notes text,
  screening_started_at timestamptz,
  screening_completed_at timestamptz,
  last_status_update timestamptz default now(),
  sla_flagged boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_candidates_client on candidates(client_id);
create index idx_candidates_status on candidates(status);
create index idx_candidates_tracking on candidates(tracking_code);
create index idx_candidates_created on candidates(created_at desc);

create trigger candidates_updated_at
  before update on candidates
  for each row execute function update_updated_at();

-- ============================================
-- COMPLIANCE_DOCUMENTS TABLE
-- Downloadable docs (FCRA forms, jurisdiction lists, etc.)
-- ============================================
create table if not exists compliance_documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  file_url text not null,
  file_type text default 'pdf',
  category text default 'compliance' check (category in ('compliance', 'fcra', 'jurisdiction', 'general')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger compliance_documents_updated_at
  before update on compliance_documents
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Clients: employers see only their own company
alter table clients enable row level security;

create policy "Service key bypass" on clients
  for all using (true) with check (true);

create policy "Client users can view their own company" on clients
  for select using (
    id in (
      select client_id from client_users
      where auth_user_id = auth.uid()
    )
  );

-- Client Users: see only own record and teammates
alter table client_users enable row level security;

create policy "Service key bypass" on client_users
  for all using (true) with check (true);

create policy "Users can view their own team" on client_users
  for select using (
    client_id in (
      select client_id from client_users
      where auth_user_id = auth.uid()
    )
  );

-- Candidates: employers see only their own candidates
alter table candidates enable row level security;

create policy "Service key bypass" on candidates
  for all using (true) with check (true);

create policy "Client users can view their own candidates" on candidates
  for select using (
    client_id in (
      select client_id from client_users
      where auth_user_id = auth.uid()
    )
  );

create policy "Client users can insert candidates" on candidates
  for insert with check (
    client_id in (
      select client_id from client_users
      where auth_user_id = auth.uid()
    )
  );

-- Compliance Documents: any authenticated user can read
alter table compliance_documents enable row level security;

create policy "Service key bypass" on compliance_documents
  for all using (true) with check (true);

create policy "Authenticated users can view documents" on compliance_documents
  for select using (auth.uid() is not null);

-- ============================================
-- AUTH TRIGGER
-- Auto-link auth.users to client_users on signup/login
-- ============================================
create or replace function link_auth_user()
returns trigger as $$
begin
  update client_users
  set auth_user_id = new.id
  where email = new.email
    and auth_user_id is null;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_auth_user();
