-- Shared conversation table for Patrick (admin panel) and Parker (Telegram).
-- Both write to the same thread_id so conversation context carries across interfaces.

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null default 'pcg-admin',      -- shared thread; default for the admin conversation
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  source text not null default 'admin_panel',         -- 'admin_panel' | 'telegram'
  sender_name text,                                   -- e.g. "Gwen" or "Martin (Telegram)"
  created_at timestamptz not null default now()
);

-- Index for fast thread lookups (most recent first)
create index if not exists idx_agent_messages_thread_created
  on public.agent_messages (thread_id, created_at desc);

-- Keep conversations from growing unbounded: auto-delete messages older than 90 days
-- (run manually or via pg_cron if available)
comment on table public.agent_messages is
  'Shared conversation history for Patrick (admin panel) and Parker (Telegram bot). Both read/write to the same thread_id.';
