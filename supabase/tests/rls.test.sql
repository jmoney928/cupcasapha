-- pgTAP: proves RLS isolates cafés and roles. Safe to run on a seeded database. Run with `supabase test db` (Docker) or
-- `npm run db:test:local` (Homebrew Postgres). Everything rolls back at the end.
begin;

create schema if not exists tests;
create or replace function tests.login(p_email text) returns void language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  if v_id is null then raise exception 'no user %', p_email; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
create or replace function tests.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'anon', true);
end $$;
create or replace function tests.logout() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
end $$;
grant usage on schema tests to authenticated, anon;
grant execute on all functions in schema tests to authenticated, anon;

select plan(69);

-- ------------------------------------------------------------------ fixtures
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.cupcasa', '{"full_name":"Alice Owner"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.cupcasa',   '{"full_name":"Bob Owner"}'),
  ('33333333-3333-3333-3333-333333333333', 'carol@test.cupcasa', '{"full_name":"Carol Multi"}'),
  ('44444444-4444-4444-4444-444444444444', 'sam@test.cupcasa',   '{"full_name":"Sam Staff"}'),
  ('55555555-5555-5555-5555-555555555555', 'ada@test.cupcasa',   '{"full_name":"Ada Admin"}');
update public.profiles set role = 'staff' where id = '44444444-4444-4444-4444-444444444444';
update public.profiles set role = 'admin' where id = '55555555-5555-5555-5555-555555555555';

insert into public.products (id, sku, name, size_oz, price_per_case_cents) values
  ('d0000000-0000-0000-0000-000000000008', 'TEST-8',  '8oz test cup',  8,  20000),
  ('d0000000-0000-0000-0000-000000000012', 'TEST-12', '12oz test cup', 12, 22000),
  ('d0000000-0000-0000-0000-000000000016', 'TEST-16', '16oz test cup', 16, 24000);

insert into public.cafes (id, name, phone, province) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cafe A', '+14165550001', 'ON'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cafe B', '+16045550002', 'BC');

insert into public.cafe_members (cafe_id, user_id, member_role) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', 'manager'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'manager');

insert into public.usage_events (cafe_id, product_id, qty, source, occurred_at) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0000000-0000-0000-0000-000000000012', 40, 'manual', now() - interval '2 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-0000-0000-000000000012', 55, 'manual', now() - interval '2 days');

insert into public.reorders (id, cafe_id, product_id, cases, subtotal_cents, tax_cents, amount_cents, status) values
  ('e0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd0000000-0000-0000-0000-000000000012', 1, 22000, 2860, 24860, 'sms_sent'),
  ('e0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd0000000-0000-0000-0000-000000000012', 1, 22000, 2860, 24860, 'sms_sent');

insert into public.orders (id, cafe_id, reorder_id, status, subtotal_cents, tax_cents, total_cents) values
  ('f0000000-0000-0000-0000-00000000000a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e0000000-0000-0000-0000-00000000000a', 'paid', 22000, 2860, 24860),
  ('f0000000-0000-0000-0000-00000000000b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 'paid', 22000, 2860, 24860);
insert into public.order_items (order_id, product_id, cases, units, unit_price_cents, line_total_cents) values
  ('f0000000-0000-0000-0000-00000000000a', 'd0000000-0000-0000-0000-000000000012', 1, 1000, 22000, 22000),
  ('f0000000-0000-0000-0000-00000000000b', 'd0000000-0000-0000-0000-000000000012', 1, 1000, 22000, 22000);

insert into public.sms_messages (cafe_id, direction, from_phone, to_phone, body, twilio_sid) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'outbound', '+18005550000', '+14165550001', 'hi A', 'SM_A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'outbound', '+18005550000', '+16045550002', 'hi B', 'SM_B');
insert into public.sms_prompts (cafe_id, kind, reorder_ids) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'reorder_approval', array['e0000000-0000-0000-0000-00000000000a']::uuid[]),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'reorder_approval', array['e0000000-0000-0000-0000-00000000000b']::uuid[]);
insert into public.cafe_notes (cafe_id, author_id, body) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', 'note A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'note B');
insert into public.pos_connections (cafe_id, provider, merchant_id, access_token_enc) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'square', 'MA', 'secret-token-a'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'square', 'MB', 'secret-token-b');

select is((select count(*) from public.profiles where email like '%@test.cupcasa')::int, 5, 'signup trigger created a profile per auth user');
select is((select count(*) from public.cafe_stock where cafe_id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') and product_id::text like 'd0000000-%')::int, 6, 'stock rows auto-created: 2 cafés × 3 products');

-- ------------------------------------------------------------------ bob: owner of café B
select tests.login('bob@test.cupcasa');
select is((select string_agg(name, ',') from public.cafes), 'Cafe B', 'bob sees only café B');
select is((select count(*) from public.reorders where cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0, 'bob cannot read café A reorders');
select tests.logout();

-- ------------------------------------------------------------------ alice: owner of café A only
select tests.login('alice@test.cupcasa');
select is((select count(*) from public.cafes)::int, 1, 'alice sees exactly one café');
select is((select name from public.cafes), 'Cafe A', '...and it is café A');
select is((select count(*) from public.cafe_stock where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int, 0, 'alice cannot read café B stock');
select is((select count(*) from public.cafe_stock where product_id::text like 'd0000000-%')::int, 3, 'alice reads café A stock only');
select is((select count(*) from public.usage_events where cafe_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0, 'alice cannot read café B usage');
select is((select count(*) from public.reorders where cafe_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0, 'alice cannot read café B reorders');
select is((select count(*) from public.orders where cafe_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0, 'alice cannot read café B orders');
select is((select count(*) from public.order_items)::int, 1, 'alice reads only café A order items');
select is((select count(*) from public.sms_messages where cafe_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0, 'alice cannot read café B SMS');
select is((select count(*) from public.sms_prompts where cafe_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 0, 'alice cannot read café B prompts');
select is((select count(*) from public.cafe_members where user_id = '22222222-2222-2222-2222-222222222222')::int, 0, 'alice cannot see café B roster');
select is((select count(*) from public.profiles)::int, 2, 'alice sees herself and café-mate carol only');
select is((select count(*) from public.profiles where id = '22222222-2222-2222-2222-222222222222')::int, 0, 'alice cannot see bob (no shared café yet)');
select is((select count(*) from public.cafe_notes)::int, 0, 'clients cannot read internal notes');
select is((select count(*) from public.audit_log)::int, 0, 'clients cannot read the audit log');
select is((select count(*) from public.pos_connections)::int, 1, 'alice sees her own POS connection row');
select throws_ok($$select access_token_enc from public.pos_connections$$, '42501', null, 'token columns are not selectable via the API');

select lives_ok($$update public.cafes set name = 'hacked' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$, 'update on café B runs (RLS silently matches 0 rows)');
select throws_ok($$update public.cafes set payment_terms = 'net30' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, '42501', null, 'client cannot change payment terms');
select throws_ok($$update public.cafes set lead_time_days = 1 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, '42501', null, 'client cannot change lead time');
select lives_ok($$update public.cafes set phone = '+14165550009', sms_opt_in = true where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'client can update phone + opt in');
select isnt((select sms_opt_in_at from public.cafes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), null, 'opt-in timestamp recorded (CASL)');
select is((select sms_opt_in_source from public.cafes where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'portal', 'opt-in source is portal');

select throws_ok($$update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111'$$, '42501', null, 'client cannot promote herself');
select throws_ok($$insert into public.products (sku, name, size_oz, price_per_case_cents) values ('X','x',1,1)$$, '42501', null, 'client cannot create products');
select throws_ok($$insert into public.usage_events (cafe_id, product_id, qty, source) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d0000000-0000-0000-0000-000000000012',1,'manual')$$, '42501', null, 'client cannot insert usage events directly');
select throws_ok($$insert into public.reorders (cafe_id, product_id, cases, subtotal_cents, amount_cents) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d0000000-0000-0000-0000-000000000012',1,1,1)$$, '42501', null, 'client cannot insert reorders directly');
select throws_ok($$select public.run_reorder_engine()$$, '42501', null, 'client cannot run the engine');

select throws_ok($$select public.record_stock_count('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','d0000000-0000-0000-0000-000000000012', 100)$$, '42501', null, 'RPC: cannot count for café B');
select lives_ok($$select public.record_stock_count('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d0000000-0000-0000-0000-000000000012', 500)$$, 'RPC: can count for café A');
select is((select est_on_hand from public.cafe_stock where cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and product_id = 'd0000000-0000-0000-0000-000000000012'), 500, 'count sets est_on_hand');
select throws_ok($$select public.request_reorder('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','d0000000-0000-0000-0000-000000000012', 1)$$, '42501', null, 'RPC: cannot reorder for café B');
select throws_ok($$select public.respond_to_reorder('e0000000-0000-0000-0000-00000000000b', true)$$, '42501', null, 'RPC: cannot approve café B reorder');
select is((select status from public.respond_to_reorder('e0000000-0000-0000-0000-00000000000a', true)), 'approved', 'RPC: can approve own reorder');
select lives_ok($$insert into public.cafe_members (cafe_id, user_id, member_role) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','manager')$$, 'owner can add a member to her café');
select throws_ok($$insert into public.cafe_members (cafe_id, user_id, member_role) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','11111111-1111-1111-1111-111111111111','owner')$$, '42501', null, 'cannot add herself to café B');
select lives_ok($$delete from public.cafes where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$, 'delete on café B runs (0 rows)');
select tests.logout();

-- ------------------------------------------------------------------ carol: manager of A and B (multi-location)
select tests.login('carol@test.cupcasa');
select is((select count(*) from public.cafes)::int, 2, 'multi-location member sees both cafés');
select throws_ok($$insert into public.cafe_members (cafe_id, user_id) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','44444444-4444-4444-4444-444444444444')$$, '42501', null, 'manager (not owner) cannot add members');
select tests.logout();

-- ------------------------------------------------------------------ bob again: alice added him to café A above
select tests.login('bob@test.cupcasa');
select is((select count(*) from public.cafes)::int, 2, 'bob now sees café A too (membership granted by its owner)');
select tests.logout();

-- ------------------------------------------------------------------ sam: staff
select tests.login('sam@test.cupcasa');
select is((select count(*) from public.cafes where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'))::int, 2, 'staff sees all cafés');
select is((select count(*) from public.profiles where email like '%@test.cupcasa')::int, 5, 'staff sees all profiles');
select lives_ok($$update public.reorders set status = 'charged' where id = 'e0000000-0000-0000-0000-00000000000b'$$, 'staff can edit reorders');
select is((select status::text from public.reorders where id = 'e0000000-0000-0000-0000-00000000000b'), 'charged', '...and the edit stuck');
select lives_ok($$update public.cafes set lead_time_days = 4 where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'staff can edit lead time');
select throws_ok($$insert into public.products (sku, name, size_oz, price_per_case_cents) values ('X','x',1,1)$$, '42501', null, 'staff cannot create products');
select lives_ok($$update public.products set price_per_case_cents = 1 where sku = 'TEST-12'$$, 'staff price update runs (RLS matches 0 rows)');
select is((select price_per_case_cents from public.products where sku = 'TEST-12'), 22000, 'staff cannot change pricing');
select throws_ok($$update public.profiles set role = 'admin' where id = '44444444-4444-4444-4444-444444444444'$$, '42501', null, 'staff cannot change roles');
select is((select count(*) from public.audit_log)::int, 0, 'staff cannot read the audit log');
select lives_ok($$update public.orders set status = 'delivered' where id = 'f0000000-0000-0000-0000-00000000000a'$$, 'staff marks order delivered');
select is((select count(*) from public.usage_events where source = 'delivery' and cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 1, 'delivery logged a delivery usage event');
select is((select est_on_hand from public.cafe_stock where cafe_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and product_id = 'd0000000-0000-0000-0000-000000000012'), 1500, 'delivery added 1,000 cups to the 500 counted');
select is((select status::text from public.reorders where id = 'e0000000-0000-0000-0000-00000000000a'), 'delivered', 'linked reorder followed the order to delivered');
select tests.logout();

-- ------------------------------------------------------------------ ada: admin
select tests.login('ada@test.cupcasa');
select lives_ok($$insert into public.products (sku, name, size_oz, price_per_case_cents) values ('TEST-20','20oz test',20,26000)$$, 'admin can create products');
select cmp_ok((select count(*) from public.audit_log where actor_id = '11111111-1111-1111-1111-111111111111' and entity = 'cafes' and action = 'update')::int, '>=', 1, 'audit log captured the client café update with actor');
select cmp_ok((select count(*) from public.audit_log where actor_id = '44444444-4444-4444-4444-444444444444' and actor_role = 'staff')::int, '>=', 2, 'audit log captured staff writes');
select lives_ok($$update public.profiles set role = 'admin' where id = '44444444-4444-4444-4444-444444444444'$$, 'admin can change roles');
select tests.logout();

-- ------------------------------------------------------------------ anon
select tests.anon();
select throws_ok($$select * from public.cafes$$, '42501', null, 'anon has no access at all');
select tests.logout();

-- ------------------------------------------------------------------ verify nothing leaked through
select is((select name from public.cafes where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Cafe B', 'café B name untouched by alice');
select is((select count(*) from public.cafes where id in ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'))::int, 2, 'café B not deleted by alice');

-- engine sanity (runs as service role in production): café B 12oz, baseline 100/day, 200 on hand → reorder
update public.reorders set status = 'delivered' where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
update public.cafe_stock set last_count_units = 200, last_count_at = clock_timestamp(), baseline_daily_burn = 100
  where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and product_id = 'd0000000-0000-0000-0000-000000000012';
select is((select count(*) from public.run_reorder_engine() where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int, 1, 'engine suggested exactly one reorder');
select is((select cases from public.reorders where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and status = 'suggested'), 2, 'cases = ceil((100×21 − 200)/1000) = 2');
select is((select amount_cents from public.reorders where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and status = 'suggested'), 49720, 'amount = 2 × $220 + 13% tax');
select is((select count(*) from public.run_reorder_engine() where cafe_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int, 0, 'engine does not duplicate an open reorder');

select * from finish();
rollback;
