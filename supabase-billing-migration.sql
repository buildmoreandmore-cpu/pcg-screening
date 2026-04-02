-- PCG Screening — Billing, Notes & Report Sent Migration
-- Run this in Supabase SQL Editor

do $$
begin
  -- Internal notes for admin to add free-text notes on candidates
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'internal_notes') then
    alter table candidates add column internal_notes text;
  end if;

  -- Track when report was sent to employer
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'report_sent_at') then
    alter table candidates add column report_sent_at timestamptz;
  end if;

  -- Track who sent the report
  if not exists (select 1 from information_schema.columns where table_name = 'candidates' and column_name = 'report_sent_by') then
    alter table candidates add column report_sent_by text;
  end if;
end $$;
