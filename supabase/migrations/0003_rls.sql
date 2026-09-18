-- ============================================================
-- 0003_rls.sql — row level security for every table
-- ============================================================
-- anon never touches these tables (the marketing site does not use Supabase)
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

alter table public.profiles           enable row level security;
alter table public.cafes              enable row level security;
alter table public.cafe_members       enable row level security;
alter table public.products           enable row level security;
alter table public.cafe_stock         enable row level security;
alter table public.usage_events       enable row level security;
alter table public.reorders           enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.sms_messages       enable row level security;
alter table public.sms_prompts        enable row level security;
alter table public.cafe_notes         enable row level security;
alter table public.audit_log          enable row level security;
alter table public.stripe_events      enable row level security;
alter table public.cron_runs          enable row level security;
alter table public.item_map           enable row level security;
alter table public.pos_connections    enable row level security;
alter table public.pos_webhook_events enable row level security;

-- profiles: see yourself; staff see everyone; only admins change roles (trigger) or delete
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
create policy profiles_select_auth_admin on public.profiles for select to supabase_auth_admin using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
create policy profiles_delete on public.profiles for delete to authenticated using (public.is_admin());

-- cafes
create policy cafes_select on public.cafes for select to authenticated
  using (public.is_cafe_member(id) or public.is_staff());
create policy cafes_insert on public.cafes for insert to authenticated with check (public.is_staff());
create policy cafes_update on public.cafes for update to authenticated
  using (public.is_cafe_member(id) or public.is_staff())          -- column restrictions enforced by trigger
  with check (public.is_cafe_member(id) or public.is_staff());
create policy cafes_delete on public.cafes for delete to authenticated using (public.is_admin());

-- cafe_members: members see their café's roster; owners + admins manage it
create policy cafe_members_select on public.cafe_members for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy cafe_members_insert on public.cafe_members for insert to authenticated
  with check (public.is_admin() or public.is_cafe_owner(cafe_id));
create policy cafe_members_update on public.cafe_members for update to authenticated
  using (public.is_admin() or public.is_cafe_owner(cafe_id))
  with check (public.is_admin() or public.is_cafe_owner(cafe_id));
create policy cafe_members_delete on public.cafe_members for delete to authenticated
  using (public.is_admin() or public.is_cafe_owner(cafe_id));

-- products: everyone signed in can read active products; admins manage
create policy products_select on public.products for select to authenticated using (active or public.is_staff());
create policy products_insert on public.products for insert to authenticated with check (public.is_admin());
create policy products_update on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_delete on public.products for delete to authenticated using (public.is_admin());

-- cafe_stock: members read; staff write; clients change counts via record_stock_count()
create policy cafe_stock_select on public.cafe_stock for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy cafe_stock_insert on public.cafe_stock for insert to authenticated with check (public.is_staff());
create policy cafe_stock_update on public.cafe_stock for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy cafe_stock_delete on public.cafe_stock for delete to authenticated using (public.is_admin());

-- usage_events
create policy usage_events_select on public.usage_events for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy usage_events_insert on public.usage_events for insert to authenticated with check (public.is_staff());
create policy usage_events_update on public.usage_events for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy usage_events_delete on public.usage_events for delete to authenticated using (public.is_admin());

-- reorders: members read; staff write; clients approve/decline/request via RPCs
create policy reorders_select on public.reorders for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy reorders_insert on public.reorders for insert to authenticated with check (public.is_staff());
create policy reorders_update on public.reorders for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy reorders_delete on public.reorders for delete to authenticated using (public.is_admin());

-- orders / order_items
create policy orders_select on public.orders for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy orders_insert on public.orders for insert to authenticated with check (public.is_staff());
create policy orders_update on public.orders for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy orders_delete on public.orders for delete to authenticated using (public.is_admin());

create policy order_items_select on public.order_items for select to authenticated
  using (public.is_staff() or exists (select 1 from public.orders o where o.id = order_id and public.is_cafe_member(o.cafe_id)));
create policy order_items_insert on public.order_items for insert to authenticated with check (public.is_staff());
create policy order_items_update on public.order_items for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy order_items_delete on public.order_items for delete to authenticated using (public.is_admin());

-- sms: members can read their own thread; only staff write (outbound goes through the app)
create policy sms_messages_select on public.sms_messages for select to authenticated
  using (public.is_staff() or (cafe_id is not null and public.is_cafe_member(cafe_id)));
create policy sms_messages_insert on public.sms_messages for insert to authenticated with check (public.is_staff());
create policy sms_messages_update on public.sms_messages for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy sms_messages_delete on public.sms_messages for delete to authenticated using (public.is_admin());

create policy sms_prompts_select on public.sms_prompts for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy sms_prompts_insert on public.sms_prompts for insert to authenticated with check (public.is_staff());
create policy sms_prompts_update on public.sms_prompts for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy sms_prompts_delete on public.sms_prompts for delete to authenticated using (public.is_admin());

-- notes: internal only
create policy cafe_notes_select on public.cafe_notes for select to authenticated using (public.is_staff());
create policy cafe_notes_insert on public.cafe_notes for insert to authenticated with check (public.is_staff());
create policy cafe_notes_update on public.cafe_notes for update to authenticated
  using (public.is_admin() or author_id = (select auth.uid()))
  with check (public.is_admin() or author_id = (select auth.uid()));
create policy cafe_notes_delete on public.cafe_notes for delete to authenticated using (public.is_admin());

-- audit_log: admins read; nobody writes through the API (triggers are security definer)
create policy audit_log_select on public.audit_log for select to authenticated using (public.is_admin());
revoke insert, update, delete on public.audit_log from authenticated;

-- cron_runs: staff read; service role writes
create policy cron_runs_select on public.cron_runs for select to authenticated using (public.is_staff());
revoke insert, update, delete on public.cron_runs from authenticated;

-- stripe_events, pos_webhook_events: service role only
revoke all on public.stripe_events, public.pos_webhook_events from authenticated;

-- item_map: members manage their own mapping; staff too; admins or members delete
create policy item_map_select on public.item_map for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
create policy item_map_insert on public.item_map for insert to authenticated
  with check (public.is_cafe_member(cafe_id) or public.is_staff());
create policy item_map_update on public.item_map for update to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff())
  with check (public.is_cafe_member(cafe_id) or public.is_staff());
create policy item_map_delete on public.item_map for delete to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_admin());

-- pos_connections: tokens never leave the server. Column grant hides the token columns from every
-- API user; the policy lets members and staff see status rows. Writes are service-role only.
revoke all on public.pos_connections from authenticated;
grant select (id, cafe_id, provider, merchant_id, token_expires_at, scopes, status, last_sync_at, last_error, created_at, updated_at)
  on public.pos_connections to authenticated;
create policy pos_connections_select on public.pos_connections for select to authenticated
  using (public.is_cafe_member(cafe_id) or public.is_staff());
