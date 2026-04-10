-- Fix link_auth_user trigger so it works when called from the gotrue (auth)
-- service context. The original function had no explicit search_path and
-- referenced unqualified `client_users` / `admin_users`, so when gotrue
-- inserted a row into auth.users the AFTER INSERT trigger fired in a
-- search_path that did NOT include `public`, raising a "relation does not
-- exist" error and surfacing as "Database error creating new user".
--
-- Fix: pin search_path to public,pg_temp and qualify table names.

create or replace function public.link_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.client_users
  set auth_user_id = new.id
  where email = new.email
    and auth_user_id is null;

  update public.admin_users
  set auth_user_id = new.id
  where email = new.email
    and auth_user_id is null;

  return new;
end;
$$;
