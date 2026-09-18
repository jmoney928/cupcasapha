-- Minimal stand-in for the pieces of a Supabase database that the migrations depend on.
-- Used ONLY by scripts/db-test-local.sh to run migrations + pgTAP tests on a plain Postgres.
-- On a real Supabase project none of this is needed.
create extension if not exists pgtap;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon')                then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated')       then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role')        then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
end $$;

create schema if not exists auth;
create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

-- Same semantics as Supabase's auth.uid(): read the JWT claims from the request setting.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(coalesce(
    current_setting('request.jwt.claim.sub', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  ), '')::uuid
$$;
create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(
    current_setting('request.jwt.claim.role', true),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )
$$;

-- Supabase grants these by default; migrations then narrow them.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Supabase grants API roles access to auth.uid()/auth.role()
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
