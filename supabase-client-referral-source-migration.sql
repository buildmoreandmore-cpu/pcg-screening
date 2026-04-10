-- Captures how the employer (client) found PCG. Set either by the admin
-- on the create-client form (Option A) or by the employer themselves on
-- their first portal login via the one-time modal (Option B).

alter table public.clients
  add column if not exists referral_source text,
  add column if not exists referral_source_other text,
  add column if not exists referral_source_captured_at timestamptz,
  add column if not exists referral_source_captured_by text; -- 'admin' | 'employer_self'

comment on column public.clients.referral_source is
  'How this client found PCG (google, referral, linkedin, event, partner, other).';
comment on column public.clients.referral_source_other is
  'Free-text answer when referral_source = other.';
comment on column public.clients.referral_source_captured_at is
  'Timestamp when the referral source was captured.';
comment on column public.clients.referral_source_captured_by is
  'Who supplied the value: admin (entered on create) or employer_self (one-time portal modal).';
