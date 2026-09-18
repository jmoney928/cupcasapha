-- ============================================================
-- 0001_schema.sql — enums, tables, indexes, updated_at triggers
-- ============================================================
create extension if not exists pgcrypto;

create type public.user_role         as enum ('client','staff','admin');
create type public.member_role       as enum ('owner','manager');
create type public.payment_terms     as enum ('card','net30');
create type public.pos_type          as enum ('none','square');
create type public.usage_source      as enum ('square','sms_count','manual','delivery');
create type public.reorder_status    as enum ('suggested','sms_sent','approved','charged','invoiced',
                                              'shipped','delivered','declined','failed');
create type public.order_status      as enum ('pending_payment','paid','invoiced','shipped','delivered','cancelled');
create type public.sms_direction     as enum ('inbound','outbound');
create type public.sms_prompt_kind   as enum ('reorder_approval','count_request');
create type public.sms_prompt_status as enum ('open','answered','expired','cancelled');
create type public.pos_conn_status   as enum ('active','revoked','error');

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- cafes ----------
create table public.cafes (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  address_line1      text,
  address_line2      text,
  city               text,
  province           text,                      -- 'ON', 'BC', ...
  postal_code        text,
  country            text not null default 'CA',
  phone              text,                      -- E.164; the number we text
  contact_email      text,
  sms_opt_in         boolean not null default false,
  sms_opt_in_at      timestamptz,               -- CASL consent timestamp
  sms_opt_in_source  text,                      -- 'portal' | 'sms' | 'staff'
  sms_stop_at        timestamptz,
  stripe_customer_id text unique,
  payment_terms      public.payment_terms not null default 'card',
  tax_rate_bps       integer not null default 1300 check (tax_rate_bps between 0 and 3000),
  pos_type           public.pos_type not null default 'none',
  square_merchant_id text,
  lead_time_days     integer not null default 3 check (lead_time_days between 0 and 60),
  safety_days        integer not null default 5 check (safety_days between 0 and 60),
  auto_ship          boolean not null default false,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index cafes_phone_key on public.cafes (phone) where phone is not null;

-- ---------- cafe_members ----------
create table public.cafe_members (
  id          uuid primary key default gen_random_uuid(),
  cafe_id     uuid not null references public.cafes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  member_role public.member_role not null default 'manager',
  created_at  timestamptz not null default now(),
  unique (cafe_id, user_id)
);
create index cafe_members_user_idx on public.cafe_members (user_id);

-- ---------- products ----------
create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  sku                  text not null unique,
  name                 text not null,
  size_oz              integer not null check (size_oz > 0),
  printed              boolean not null default false,
  units_per_case       integer not null default 1000 check (units_per_case > 0),
  units_per_sleeve     integer not null default 50   check (units_per_sleeve > 0),
  price_per_case_cents integer not null check (price_per_case_cents >= 0),   -- CAD, ex-tax
  active               boolean not null default true,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------- cafe_stock ----------
create table public.cafe_stock (
  id                  uuid primary key default gen_random_uuid(),
  cafe_id             uuid not null references public.cafes(id) on delete cascade,
  product_id          uuid not null references public.products(id) on delete restrict,
  last_count_units    integer not null default 0,          -- anchor: last confirmed count (cups)
  last_count_at       timestamptz not null default now(),
  baseline_daily_burn numeric(10,2) not null default 0,    -- set at onboarding
  est_on_hand         integer not null default 0,          -- derived
  daily_burn          numeric(10,2) not null default 0,    -- derived
  reorder_point       integer not null default 0,          -- derived
  burn_source         text not null default 'baseline',    -- 'baseline' | 'rolling'
  computed_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (cafe_id, product_id)
);

-- ---------- usage_events ----------
-- qty semantics: source in (square, manual, sms_count) = cups consumed (sms_count may be negative:
-- it is the correction between our estimate and the reported count). source = delivery = cups received.
create table public.usage_events (
  id          uuid primary key default gen_random_uuid(),
  cafe_id     uuid not null references public.cafes(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  qty         integer not null,
  source      public.usage_source not null,
  occurred_at timestamptz not null default now(),
  external_id text,                                        -- square order id / 'order:<id>:<item>' for idempotency
  note        text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index usage_events_lookup_idx on public.usage_events (cafe_id, product_id, occurred_at desc);
create unique index usage_events_external_key on public.usage_events (source, external_id, product_id)
  where external_id is not null;

-- ---------- reorders ----------
create table public.reorders (
  id                         uuid primary key default gen_random_uuid(),
  cafe_id                    uuid not null references public.cafes(id) on delete cascade,
  product_id                 uuid not null references public.products(id) on delete restrict,
  cases                      integer not null check (cases >= 1),
  subtotal_cents             integer not null check (subtotal_cents >= 0),
  tax_cents                  integer not null default 0 check (tax_cents >= 0),
  amount_cents               integer not null check (amount_cents >= 0),   -- subtotal + tax, CAD
  status                     public.reorder_status not null default 'suggested',
  est_on_hand_at_creation    integer,
  daily_burn_at_creation     numeric(10,2),
  days_of_cover_at_creation  numeric(10,1),
  stripe_payment_intent_id   text unique,
  stripe_invoice_id          text unique,
  stripe_checkout_session_id text,                          -- recovery link when off-session charge fails
  failure_reason             text,
  approved_by                uuid references public.profiles(id),
  approved_via               text,                          -- 'sms' | 'portal' | 'staff' | 'auto'
  responded_at               timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index reorders_cafe_status_idx on public.reorders (cafe_id, status);
create index reorders_status_idx on public.reorders (status, created_at desc);
create unique index reorders_one_pending_per_product on public.reorders (cafe_id, product_id)
  where status in ('suggested','sms_sent','approved','failed');

-- ---------- orders ----------
create sequence public.order_number_seq start 1001;
create table public.orders (
  id                       uuid primary key default gen_random_uuid(),
  order_number             text not null unique default ('CC-' || nextval('public.order_number_seq')),
  cafe_id                  uuid not null references public.cafes(id) on delete restrict,
  reorder_id               uuid unique references public.reorders(id) on delete set null,
  status                   public.order_status not null default 'pending_payment',
  subtotal_cents           integer not null check (subtotal_cents >= 0),
  tax_cents                integer not null default 0,
  shipping_cents           integer not null default 0,
  total_cents              integer not null check (total_cents >= 0),
  currency                 text not null default 'cad',
  stripe_payment_intent_id text unique,
  stripe_invoice_id        text unique,
  invoice_url              text,                            -- Stripe hosted invoice / receipt PDF
  receipt_url              text,
  carrier                  text,
  tracking_number          text,
  shipped_at               timestamptz,
  delivered_at             timestamptz,
  ship_to                  jsonb,                           -- address snapshot at order time
  created_by               uuid references public.profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index orders_cafe_idx on public.orders (cafe_id, created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete restrict,
  cases            integer not null check (cases > 0),
  units            integer not null check (units > 0),      -- cases * units_per_case, snapshot
  unit_price_cents integer not null,                        -- per case, snapshot
  line_total_cents integer not null
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------- sms ----------
create table public.sms_messages (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid references public.cafes(id) on delete set null,   -- null = unmatched inbound
  direction    public.sms_direction not null,
  from_phone   text not null,
  to_phone     text not null,
  body         text not null,
  twilio_sid   text unique,
  status       text,                                        -- queued/sent/delivered/failed/received
  error_code   text,
  needs_review boolean not null default false,              -- unrecognized reply → admin inbox flag
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index sms_messages_cafe_idx on public.sms_messages (cafe_id, created_at desc);
create index sms_messages_review_idx on public.sms_messages (needs_review) where needs_review;

-- What question is currently outstanding for a café, so an inbound "YES" or "40" can be resolved.
create table public.sms_prompts (
  id                uuid primary key default gen_random_uuid(),
  cafe_id           uuid not null references public.cafes(id) on delete cascade,
  kind              public.sms_prompt_kind not null,
  product_id        uuid references public.products(id),    -- count_request
  reorder_ids       uuid[] not null default '{}',            -- reorder_approval (one SMS may cover several sizes)
  status            public.sms_prompt_status not null default 'open',
  sent_message_id   uuid references public.sms_messages(id),
  answer_message_id uuid references public.sms_messages(id),
  sent_at           timestamptz,
  expires_at        timestamptz not null default now() + interval '7 days',
  answered_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index sms_prompts_open_idx on public.sms_prompts (cafe_id, created_at desc) where status = 'open';

-- ---------- notes / audit / integrations ----------
create table public.cafe_notes (
  id         uuid primary key default gen_random_uuid(),
  cafe_id    uuid not null references public.cafes(id) on delete cascade,
  author_id  uuid references public.profiles(id),
  body       text not null,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id         bigserial primary key,
  actor_id   uuid,                                          -- null = system (cron/webhook)
  actor_role public.user_role,
  action     text not null,                                 -- insert | update | delete | custom verbs
  entity     text not null,
  entity_id  text,
  diff       jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity, entity_id);
create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

create table public.stripe_events (                          -- webhook idempotency
  id           text primary key,
  type         text not null,
  processed_at timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);

create table public.cron_runs (                              -- observability for admin overview
  id          uuid primary key default gen_random_uuid(),
  job         text not null,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  summary     jsonb,
  error       text
);

-- ---------- phase 2: POS ----------
create table public.item_map (
  id                  uuid primary key default gen_random_uuid(),
  cafe_id             uuid not null references public.cafes(id) on delete cascade,
  square_variation_id text not null,
  product_id          uuid not null references public.products(id) on delete cascade,
  cups_per_item       numeric(6,2) not null default 1,
  unique (cafe_id, square_variation_id)
);

create table public.pos_connections (
  id                uuid primary key default gen_random_uuid(),
  cafe_id           uuid not null references public.cafes(id) on delete cascade,
  provider          public.pos_type not null,
  merchant_id       text,
  access_token_enc  text,                                   -- AES-256-GCM, key in env (never in DB)
  refresh_token_enc text,
  token_expires_at  timestamptz,
  scopes            text[],
  status            public.pos_conn_status not null default 'active',
  last_sync_at      timestamptz,
  last_error        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (cafe_id, provider)
);

create table public.pos_webhook_events (
  id           text primary key,                             -- provider event id
  provider     public.pos_type not null,
  payload      jsonb not null,
  processed_at timestamptz,
  error        text,
  created_at   timestamptz not null default now()
);

-- updated_at triggers
do $$ declare t text; begin
  foreach t in array array['profiles','cafes','products','cafe_stock','reorders','orders','pos_connections'] loop
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
