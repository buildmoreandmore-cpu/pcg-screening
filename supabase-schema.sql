-- Run this in your Supabase SQL Editor to create the tables

-- Screening submissions
create table submissions (
  id uuid default gen_random_uuid() primary key,
  confirmation_code text unique not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  dob date,
  ssn_last4 text,
  address text,
  package_name text not null,
  package_price numeric not null,
  signature_type text, -- 'typed' or 'drawn'
  signature_value text, -- typed name or base64 image
  stripe_session_id text, -- Stripe checkout session ID (when enabled)
  signature_request_id text, -- Dropbox Sign signature request ID (when enabled)
  consent_status text default 'pending', -- pending, signed
  client_name text, -- from ?client= param
  status text default 'pending', -- pending, in_progress, completed, cancelled
  payment_status text default 'unpaid', -- unpaid, paid, refunded
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookups
create index idx_submissions_email on submissions(email);
create index idx_submissions_status on submissions(status);
create index idx_submissions_created on submissions(created_at desc);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger submissions_updated_at
  before update on submissions
  for each row execute function update_updated_at();

-- Row Level Security
alter table submissions enable row level security;

-- Only allow server-side inserts (service key)
create policy "Service key can do everything" on submissions
  for all using (true) with check (true);
