-- ============================================================
-- 0002_functions.sql — role helpers, JWT hook, guards, audit, engine, RPCs
-- ============================================================

-- ---- role helpers (security definer so they bypass RLS on profiles; no recursion) ----
create or replace function public.current_user_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = (select auth.uid())
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = (select auth.uid())) in ('staff','admin'), false)
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = (select auth.uid())) = 'admin', false)
$$;
create or replace function public.is_cafe_member(p_cafe uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cafe_members where cafe_id = p_cafe and user_id = (select auth.uid()))
$$;
create or replace function public.is_cafe_owner(p_cafe uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.cafe_members
                 where cafe_id = p_cafe and user_id = (select auth.uid()) and member_role = 'owner')
$$;
revoke execute on function public.current_user_role(), public.is_staff(), public.is_admin(),
  public.is_cafe_member(uuid), public.is_cafe_owner(uuid) from public, anon;
grant execute on function public.current_user_role(), public.is_staff(), public.is_admin(),
  public.is_cafe_member(uuid), public.is_cafe_owner(uuid) to authenticated;

-- ---- put the role into the JWT so proxy.ts can gate routes without a DB call ----
-- Enable in supabase/config.toml: [auth.hook.custom_access_token] (local) or Dashboard → Auth → Hooks (hosted).
create or replace function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable set search_path = public as $$
declare claims jsonb; r text;
begin
  select role::text into r from public.profiles where id = (event->>'user_id')::uuid;
  claims := event->'claims';
  if claims->'app_metadata' is null then claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb); end if;
  claims := jsonb_set(claims, '{app_metadata,user_role}', to_jsonb(coalesce(r, 'client')));
  return jsonb_set(event, '{claims}', claims);
end $$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.profiles to supabase_auth_admin;

-- ---- profile auto-create on signup ----
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- guards ----
create or replace function public.guard_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'only admins can change roles' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'profile id is immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger profiles_guard_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Clients may edit contact/address/opt-in/auto_ship; everything else is staff/admin only.
create or replace function public.guard_cafe_columns() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and auth.uid() is not null and not public.is_staff() then
    if new.payment_terms is distinct from old.payment_terms
       or new.tax_rate_bps is distinct from old.tax_rate_bps
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.lead_time_days is distinct from old.lead_time_days
       or new.safety_days is distinct from old.safety_days
       or new.pos_type is distinct from old.pos_type
       or new.square_merchant_id is distinct from old.square_merchant_id
       or new.active is distinct from old.active then
      raise exception 'column is staff-only' using errcode = '42501';
    end if;
  end if;
  -- CASL consent timestamps
  if tg_op = 'INSERT' then
    if new.sms_opt_in then
      new.sms_opt_in_at := coalesce(new.sms_opt_in_at, now());
      new.sms_opt_in_source := coalesce(new.sms_opt_in_source, 'staff');
    end if;
  elsif new.sms_opt_in and not old.sms_opt_in then
    new.sms_opt_in_at := now();
    new.sms_opt_in_source := coalesce(new.sms_opt_in_source,
      case when auth.uid() is null then 'sms' when public.is_staff() then 'staff' else 'portal' end);
  elsif old.sms_opt_in and not new.sms_opt_in then
    new.sms_stop_at := now();
  end if;
  return new;
end $$;
create trigger cafes_guard_columns before insert or update on public.cafes
  for each row execute function public.guard_cafe_columns();

-- ---- every café has a stock row per active product ----
create or replace function public.ensure_cafe_stock() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.cafe_stock (cafe_id, product_id)
  select c.id, p.id from public.cafes c cross join public.products p
  where p.active and (tg_table_name = 'products' or c.id = new.id)
    and (tg_table_name = 'cafes' or p.id = new.id)
  on conflict (cafe_id, product_id) do nothing;
  return new;
end $$;
create trigger cafes_ensure_stock after insert on public.cafes for each row execute function public.ensure_cafe_stock();
create trigger products_ensure_stock after insert on public.products for each row execute function public.ensure_cafe_stock();

-- ---- audit: every write to business tables ----
create or replace function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_role  public.user_role;
  v_diff  jsonb;
  v_id    text;
begin
  if v_actor is null and nullif(current_setting('app.actor_id', true), '') is not null then
    v_actor := current_setting('app.actor_id', true)::uuid;       -- service-role code sets this per tx
  end if;
  if v_actor is not null then select role into v_role from public.profiles where id = v_actor; end if;

  if tg_op = 'INSERT' then
    v_diff := jsonb_build_object('new', to_jsonb(new) - 'access_token_enc' - 'refresh_token_enc');
    v_id := new.id::text;
  elsif tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('old', o.value, 'new', n.value)) into v_diff
    from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value
      and n.key not in ('updated_at','computed_at','access_token_enc','refresh_token_enc');
    if v_diff is null then return null; end if;
    v_id := new.id::text;
  else
    v_diff := jsonb_build_object('old', to_jsonb(old) - 'access_token_enc' - 'refresh_token_enc');
    v_id := old.id::text;
  end if;

  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id, diff)
  values (v_actor, v_role, lower(tg_op), tg_table_name, v_id, v_diff);
  return null;
end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','cafes','cafe_members','products','cafe_stock','usage_events',
                           'reorders','orders','order_items','sms_prompts','cafe_notes','item_map','pos_connections'] loop
    execute format('create trigger %I_audit after insert or update or delete on public.%I
                    for each row execute function public.audit_row_change()', t, t);
  end loop;
end $$;

-- App-level audit entries for actions that are not a single row write (e.g. "approved on behalf", "retry charge").
create or replace function public.audit_event(p_action text, p_entity text, p_entity_id text, p_diff jsonb default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_role public.user_role;
begin
  if v_actor is null and nullif(current_setting('app.actor_id', true), '') is not null then
    v_actor := current_setting('app.actor_id', true)::uuid;
  end if;
  if v_actor is not null then select role into v_role from public.profiles where id = v_actor; end if;
  insert into public.audit_log (actor_id, actor_role, action, entity, entity_id, diff)
  values (v_actor, v_role, p_action, p_entity, p_entity_id, p_diff);
end $$;

-- ---- reorder engine (pure SQL; side effects happen in the app) ----
-- daily_burn:   14-day rolling avg of consumed cups × 1.05; baseline if < 7 days of data or no usage.
-- est_on_hand:  anchor + deliveries − max(observed usage, daily_burn × days since anchor).
--               (cafés without a POS report weekly, so between counts we project from burn rate.)
-- reorder_point: daily_burn × (lead_time_days + safety_days)
create or replace function public.refresh_cafe_stock(p_cafe uuid default null) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with usage14 as (
    select cafe_id, product_id, sum(qty) as used
    from public.usage_events
    where source <> 'delivery' and occurred_at > now() - interval '14 days'
      and (p_cafe is null or cafe_id = p_cafe)
    group by 1, 2
  ),
  first_usage as (
    select cafe_id, product_id, min(occurred_at) as first_at
    from public.usage_events
    where source <> 'delivery' and (p_cafe is null or cafe_id = p_cafe)
    group by 1, 2
  ),
  burn as (
    select s.id,
           case when coalesce(u.used, 0) <= 0 or f.first_at > now() - interval '7 days'
                then s.baseline_daily_burn
                else round(u.used / 14.0 * 1.05, 2) end as daily_burn,
           case when coalesce(u.used, 0) <= 0 or f.first_at > now() - interval '7 days'
                then 'baseline' else 'rolling' end as burn_source
    from public.cafe_stock s
    left join usage14 u     on u.cafe_id = s.cafe_id and u.product_id = s.product_id
    left join first_usage f on f.cafe_id = s.cafe_id and f.product_id = s.product_id
    where p_cafe is null or s.cafe_id = p_cafe
  ),
  since as (
    select s.id,
           coalesce(sum(e.qty) filter (where e.source <> 'delivery'), 0) as observed,
           coalesce(sum(e.qty) filter (where e.source = 'delivery'), 0)  as delivered
    from public.cafe_stock s
    left join public.usage_events e on e.cafe_id = s.cafe_id and e.product_id = s.product_id
                                   and e.occurred_at > s.last_count_at
    where p_cafe is null or s.cafe_id = p_cafe
    group by s.id
  ),
  upd as (
    update public.cafe_stock s
    set daily_burn    = b.daily_burn,
        burn_source   = b.burn_source,
        est_on_hand   = greatest(0, s.last_count_units + w.delivered
                          - greatest(w.observed,
                                     round(b.daily_burn * extract(epoch from now() - s.last_count_at) / 86400)::int)),
        reorder_point = ceil(b.daily_burn * (c.lead_time_days + c.safety_days))::int,
        computed_at   = now()
    from burn b, since w, public.cafes c
    where b.id = s.id and w.id = s.id and c.id = s.cafe_id
    returning 1
  )
  select count(*) into n from upd;
  return n;
end $$;

create or replace function public.run_reorder_engine() returns setof public.reorders
language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_cafe_stock();
  return query
  with ins as (
    insert into public.reorders (cafe_id, product_id, cases, subtotal_cents, tax_cents, amount_cents, status,
                                 est_on_hand_at_creation, daily_burn_at_creation, days_of_cover_at_creation)
    select s.cafe_id, s.product_id, x.cases,
           x.subtotal, x.tax, x.subtotal + x.tax,
           'suggested',
           s.est_on_hand, s.daily_burn, round(s.est_on_hand / s.daily_burn, 1)
    from public.cafe_stock s
    join public.cafes c    on c.id = s.cafe_id and c.active
    join public.products p on p.id = s.product_id and p.active
    cross join lateral (
      select cases,
             cases * p.price_per_case_cents as subtotal,
             round(cases * p.price_per_case_cents * c.tax_rate_bps / 10000.0)::int as tax
      from (select greatest(1, ceil((s.daily_burn * 21 - s.est_on_hand) / p.units_per_case))::int as cases) q
    ) x
    where s.daily_burn > 0
      and s.est_on_hand <= s.reorder_point
      and not exists (select 1 from public.reorders r
                      where r.cafe_id = s.cafe_id and r.product_id = s.product_id
                        and r.status not in ('delivered','declined'))
      and not exists (select 1 from public.reorders r
                      where r.cafe_id = s.cafe_id and r.product_id = s.product_id
                        and r.status = 'declined' and r.responded_at > now() - interval '7 days')
    returning *
  )
  select * from ins;
end $$;

-- prompts nobody answered → expire; their reorders → declined (cooldown applies, we re-ask in 7 days)
create or replace function public.expire_sms_prompts() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with e as (
    update public.sms_prompts set status = 'expired'
    where status = 'open' and expires_at < now()
    returning reorder_ids
  )
  update public.reorders r
  set status = 'declined', failure_reason = 'no response', responded_at = now()
  from e where r.id = any (e.reorder_ids) and r.status = 'sms_sent';
  get diagnostics n = row_count;
  return n;
end $$;

-- ---- client-callable RPCs (membership checked inside; direct table writes stay staff-only) ----
create or replace function public.record_stock_count(p_cafe uuid, p_product uuid, p_units integer,
                                                     p_source public.usage_source default 'manual')
returns public.cafe_stock
language plpgsql security definer set search_path = public as $$
declare s public.cafe_stock; observed int; delivered int; correction int; v_at timestamptz := clock_timestamp();
begin
  if not (public.is_cafe_member(p_cafe) or public.is_staff() or auth.uid() is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_units < 0 then raise exception 'units must be >= 0'; end if;
  if p_source not in ('manual','sms_count') then raise exception 'source must be manual or sms_count'; end if;
  select * into s from public.cafe_stock where cafe_id = p_cafe and product_id = p_product for update;
  if not found then raise exception 'no stock row for cafe/product'; end if;

  select coalesce(sum(qty) filter (where source <> 'delivery'), 0),
         coalesce(sum(qty) filter (where source = 'delivery'), 0)
    into observed, delivered
  from public.usage_events where cafe_id = p_cafe and product_id = p_product and occurred_at > s.last_count_at;

  -- usage that happened but was not otherwise recorded (all of it for non-POS cafés)
  correction := s.last_count_units + delivered - observed - p_units;
  insert into public.usage_events (cafe_id, product_id, qty, source, occurred_at, note, created_by)
  values (p_cafe, p_product, correction, p_source, v_at, 'count correction', auth.uid());

  update public.cafe_stock set last_count_units = p_units, last_count_at = v_at where id = s.id;
  perform public.refresh_cafe_stock(p_cafe);
  select * into s from public.cafe_stock where id = s.id;
  return s;
end $$;

create or replace function public.request_reorder(p_cafe uuid, p_product uuid, p_cases integer)
returns public.reorders
language plpgsql security definer set search_path = public as $$
declare r public.reorders; p public.products; c public.cafes; s public.cafe_stock; v_sub int; v_tax int;
begin
  if not (public.is_cafe_member(p_cafe) or public.is_staff()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_cases < 1 or p_cases > 50 then raise exception 'cases must be between 1 and 50'; end if;
  select * into p from public.products where id = p_product and active;
  select * into c from public.cafes where id = p_cafe;
  if p.id is null or c.id is null then raise exception 'not found'; end if;
  select * into s from public.cafe_stock where cafe_id = p_cafe and product_id = p_product;

  -- a pending suggestion for this size is superseded by the explicit request
  update public.reorders
  set status = 'declined', failure_reason = 'superseded by manual reorder', responded_at = now()
  where cafe_id = p_cafe and product_id = p_product and status in ('suggested','sms_sent','failed');
  update public.sms_prompts set status = 'cancelled'
  where cafe_id = p_cafe and kind = 'reorder_approval' and status = 'open';

  v_sub := p_cases * p.price_per_case_cents;
  v_tax := round(v_sub * c.tax_rate_bps / 10000.0)::int;
  insert into public.reorders (cafe_id, product_id, cases, subtotal_cents, tax_cents, amount_cents, status,
                               approved_by, approved_via, responded_at,
                               est_on_hand_at_creation, daily_burn_at_creation)
  values (p_cafe, p_product, p_cases, v_sub, v_tax, v_sub + v_tax, 'approved',
          auth.uid(), case when public.is_staff() then 'staff' else 'portal' end, now(),
          s.est_on_hand, s.daily_burn)
  returning * into r;
  return r;
end $$;

create or replace function public.respond_to_reorder(p_reorder uuid, p_approve boolean, p_via text default 'portal')
returns public.reorders
language plpgsql security definer set search_path = public as $$
declare r public.reorders;
begin
  select * into r from public.reorders where id = p_reorder for update;
  if r.id is null then raise exception 'not found'; end if;
  if not (public.is_cafe_member(r.cafe_id) or public.is_staff() or auth.uid() is null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if r.status not in ('suggested','sms_sent','failed') then
    raise exception 'reorder is not pending (status %)', r.status;
  end if;

  update public.reorders
  set status = case when p_approve then 'approved' else 'declined' end::public.reorder_status,
      approved_by = auth.uid(), approved_via = p_via, responded_at = now(),
      failure_reason = case when p_approve then null else 'declined by cafe' end
  where id = p_reorder returning * into r;

  update public.sms_prompts set status = 'answered', answered_at = now()
  where status = 'open' and kind = 'reorder_approval' and p_reorder = any (reorder_ids);
  return r;
end $$;

-- staff-only: manual stock adjustment (logged as a manual usage event; negative qty adds stock)
create or replace function public.adjust_stock(p_cafe uuid, p_product uuid, p_qty_consumed integer, p_note text)
returns public.cafe_stock
language plpgsql security definer set search_path = public as $$
declare s public.cafe_stock;
begin
  if not (public.is_staff() or auth.uid() is null) then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.usage_events (cafe_id, product_id, qty, source, occurred_at, note, created_by)
  values (p_cafe, p_product, p_qty_consumed, 'manual', clock_timestamp(), p_note, auth.uid());
  perform public.refresh_cafe_stock(p_cafe);
  select * into s from public.cafe_stock where cafe_id = p_cafe and product_id = p_product;
  return s;
end $$;

-- ---- fulfillment side effects ----
create or replace function public.on_order_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'shipped' and old.status is distinct from 'shipped' then
    new.shipped_at := coalesce(new.shipped_at, clock_timestamp());
  end if;
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at := coalesce(new.delivered_at, clock_timestamp());
    insert into public.usage_events (cafe_id, product_id, qty, source, occurred_at, external_id, note)
    select new.cafe_id, oi.product_id, oi.units, 'delivery', new.delivered_at,
           'order:' || new.id || ':' || oi.id, 'Delivered ' || new.order_number
    from public.order_items oi where oi.order_id = new.id
    on conflict do nothing;
    perform public.refresh_cafe_stock(new.cafe_id);
  end if;
  if new.reorder_id is not null and new.status in ('shipped','delivered') and new.status is distinct from old.status then
    update public.reorders set status = new.status::text::public.reorder_status where id = new.reorder_id;
  end if;
  return new;
end $$;
create trigger orders_status_change before update on public.orders
  for each row execute function public.on_order_status_change();

-- ---- function privileges ----
-- engine + expiry: service role only
revoke execute on function public.run_reorder_engine(), public.expire_sms_prompts()
  from public, anon, authenticated;
revoke execute on function public.refresh_cafe_stock(uuid) from public, anon;
grant  execute on function public.refresh_cafe_stock(uuid) to authenticated;   -- recompute-only; safe for signed-in users
revoke execute on function public.audit_event(text,text,text,jsonb) from public, anon;
revoke execute on function public.record_stock_count(uuid,uuid,integer,public.usage_source),
  public.request_reorder(uuid,uuid,integer), public.respond_to_reorder(uuid,boolean,text),
  public.adjust_stock(uuid,uuid,integer,text) from public, anon;
