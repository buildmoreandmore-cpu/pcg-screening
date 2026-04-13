-- Support tickets table for agent API bug reports and issues
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  tracking_code text not null,
  subject text not null,
  description text,
  category text not null default 'general',
  priority text not null default 'medium',
  status text not null default 'open',
  reporter_name text,
  reporter_email text,
  candidate_id uuid references public.candidates(id),
  client_id uuid references public.clients(id),
  assigned_to text,
  resolved_at timestamptz,
  resolution_notes text,
  source text not null default 'agent_api',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_tracking on public.support_tickets(tracking_code);
create index if not exists idx_support_tickets_created on public.support_tickets(created_at desc);

comment on table public.support_tickets is 'Support tickets / bug reports logged via agent API or admin panel.';
