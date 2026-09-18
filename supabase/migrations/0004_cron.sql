-- ============================================================
-- 0004_cron.sql — pg_cron → pg_net → Next.js cron routes (bearer secret)
-- ============================================================
-- Hosted Supabase: enable pg_cron + pg_net in Dashboard → Database → Extensions (or these statements).
-- Then store the two secrets once, in SQL editor (never commit them):
--   select vault.create_secret('https://cups.cupcasa.com', 'app_url');
--   select vault.create_secret('<same value as CRON_SECRET in Vercel>', 'cron_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.call_app_cron(p_path text) returns bigint
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'app_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_secret is null then
    raise exception 'vault secrets app_url / cron_secret are not set';
  end if;
  return net.http_post(
    url     := v_url || p_path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_secret, 'Content-Type', 'application/json'),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000);
end $$;
revoke execute on function public.call_app_cron(text) from public, anon, authenticated;

-- Times are UTC. 07:15 UTC = 03:15 EDT / 02:15 EST. Monday 13:00 UTC = 09:00 EDT.
select cron.schedule('cupcasa-nightly-reorders', '15 7 * * *', $$ select public.call_app_cron('/api/cron/nightly') $$);
select cron.schedule('cupcasa-weekly-count',     '0 13 * * 1', $$ select public.call_app_cron('/api/cron/weekly-count') $$);
select cron.schedule('cupcasa-square-backfill',  '30 8 * * *', $$ select public.call_app_cron('/api/cron/square-backfill') $$);
