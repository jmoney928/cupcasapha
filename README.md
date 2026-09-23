# cupcasa — PHA cups subsite

Marketing + commerce subsite for cupcasa's fully-PHA, unbranded compostable cups.
"Phade-style" education + sustainability credibility wrapped in "Poppi-style" bold,
playful branding. Intended to live at **cups.cupcasa.com**.

## Stack
- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS v4** (design tokens in `src/app/globals.css`)
- **Stripe Checkout** for online card orders
- Fonts: Fredoka (display) + Nunito (body) via `next/font`

## Getting started
```bash
npm install
cp .env.example .env.local   # add your keys
npm run dev
```

## Environment variables
| Var | Purpose |
| --- | --- |
| `STRIPE_SECRET_KEY` | Enables online checkout. Until set, the cart shows a friendly "not connected yet" message. |
| `NEXT_PUBLIC_SITE_URL` | Used for Stripe redirect URLs in production. |
| `LEADS_EMAIL` | Where wholesale/contact submissions should be routed (wire up a provider in `src/app/api/lead/route.ts`). |

## Catalog
Single source of truth: [`src/lib/products.ts`](src/lib/products.ts). All sold by the case of 1,000.

| Size | Per cup | Per case |
| --- | --- | --- |
| 8oz | $0.20 | $200 |
| 12oz | $0.22 | $220 |
| 16oz double wall | $0.24 | $264 |

## Structure
- `src/app/` — pages: home, `shop`, `shop/[slug]`, `why-pha`, `sustainability`, `wholesale`, `contact`, `about`, `privacy`, `terms`, checkout success
- `src/app/api/checkout` — Stripe session creation
- `src/app/api/lead` — wholesale/contact form intake (logs by default; wire to email/CRM)
- `src/components/` — header, footer, cart drawer + context, product cards, lead form, UI primitives, cup illustration

## TODO before launch
- Add real product photography (replace the stylized `Cup` SVG)
- Plug in real certification numbers/bodies on `/sustainability`
- Connect `api/lead` to an email or CRM provider
- Add the production Stripe key and configure the `cups.cupcasa.com` domain

---

## Portal + admin (in progress)

The café portal (`/portal`) and internal admin (`/admin`) live alongside the marketing site
(which moved, URLs unchanged, into `src/app/(marketing)/`). Done so far: database + RLS (step 1),
auth and role routing (step 2), admin screens (step 3), client portal (step 4). Still to come:
the nightly reorder engine side-effects, Twilio SMS, Stripe charging/webhooks, Square.

### Running it locally

```bash
colima start && supabase start        # local Supabase (Docker via Colima)
supabase status -o env                # copy API_URL / ANON_KEY / SERVICE_ROLE_KEY into .env.local
npm run seed                          # demo users, 3 cafés, 6 SKUs, 30 days of usage
npm run dev                           # http://localhost:3000/login
```

Seed logins (password `cupcasa-demo`):

| Email | Role | Lands on |
| --- | --- | --- |
| `admin@cupcasa.test` | admin | `/admin` (everything incl. products, users, audit) |
| `staff@cupcasa.test` | staff | `/admin` (no products/users/audit) |
| `alice@northside.test` | client, owner of two cafés | `/portal` with a location switcher |
| `carol@northside.test` | client, manager | `/portal` |
| `bob@commongrounds.test` | client, owner | `/portal` |

Magic-link emails on the local stack land in Mailpit at http://127.0.0.1:54324.

### Roles and access

- One login page (`/login`): email link or password. Accounts are invitation-only.
- `src/proxy.ts` (Next 16 middleware) reads the role from the JWT (`app_metadata.user_role`, added by the
  `custom_access_token_hook`) and redirects: signed-out → `/login`, clients → never `/admin`, staff/admin → never `/portal`.
- Layouts re-check the `profiles` row, and RLS enforces everything at the database, so UI hiding is never the only guard.
- Client mutations go through security-definer RPCs (`record_stock_count`, `request_reorder`, `respond_to_reorder`);
  staff write through RLS-scoped tables; the service-role key is only used for user invites, webhooks and cron.

### First admin on a real project

```bash
npm run make-admin -- you@cupcasa.com                 # sends an invite email
npm run make-admin -- you@cupcasa.com 'a-password'    # or create with a password right away
```


### Database (Supabase)

Migrations live in `supabase/migrations/` and run in order:

| File | Contents |
| --- | --- |
| `0001_schema.sql` | enums, tables, indexes |
| `0002_functions.sql` | role helpers, JWT claim hook, guards, audit trigger, reorder engine, client RPCs |
| `0003_rls.sql` | row level security for every table |
| `0004_cron.sql` | pg_cron schedules that call the app's cron routes (needs Vault secrets, see file header) |

**Hosted project:** `npx supabase link --project-ref <ref>` then `npm run db:push`.
Afterwards enable the access-token hook in Dashboard → Authentication → Hooks → *Customize Access Token*
→ `public.custom_access_token_hook`, and run the two `vault.create_secret` statements from the top of
`0004_cron.sql`.

**Local Supabase (needs Docker):** `supabase start` (first run pulls images), then `npm run db:test`.
`npm run db:reset` re-applies migrations from scratch. `supabase stop` shuts the stack down.
On this Mac Docker runs headless through Colima: `colima start` before `supabase start`.

**No Docker?** `npm run db:test:local` applies migrations 0001–0003 and runs the pgTAP suite on a
throwaway Homebrew Postgres cluster (`brew install postgresql@17`, plus pgTAP built from source into it).
It stubs the tiny bit of Supabase the migrations depend on (`auth.users`, `auth.uid()`, the API roles).

### RLS test suite

`supabase/tests/rls.test.sql` proves, as real JWT subjects:

- a café owner sees only their café across every table (stock, usage, reorders, orders, items, SMS, prompts, roster) and cannot update, delete, or act on another café via RPC;
- clients cannot change staff-only columns, promote themselves, or touch products, usage or reorders directly;
- a multi-location manager sees both cafés but cannot manage members;
- staff can edit reorders, orders and lead times but cannot change pricing or roles, and cannot read the audit log;
- admins can; the audit log records actor and role;
- `anon` has no access;
- delivering an order adds stock and advances the linked reorder; the engine suggests correct case counts and never duplicates an open reorder.

### Reorder engine and cron (step 5)

The maths lives in Postgres (`refresh_cafe_stock`, `run_reorder_engine`, `expire_sms_prompts`); the side effects
live in the app:

| Route | Schedule (pg_cron, UTC) | What it does |
| --- | --- | --- |
| `POST /api/cron/nightly` | 07:15 daily | expire unanswered texts → suggest reorders → auto-ship cafés are charged, SMS cafés get one approval text, others wait in the queue → any approved reorders go to payment |
| `POST /api/cron/weekly-count` | Mon 13:00 | texts opted-in cafés one size at a time: "roughly how many sleeves…" |

Both require `Authorization: Bearer $CRON_SECRET`. pg_cron sends it via Vault (see `0004_cron.sql`); Vercel Cron
sends the same header automatically when `CRON_SECRET` is set. Staff can also press **Run nightly now** and
**Send count texts** on `/admin`.

Payment (`src/lib/stripe/charge.ts`): card cafés → off-session PaymentIntent on the saved card; declines or
authentication-required → the reorder is marked `failed`, a 24-hour hosted payment link is created and texted,
and it shows under *Failed payments*. Net-30 cafés → a Stripe Invoice with 30-day terms. Without
`STRIPE_SECRET_KEY` the reorder stays `approved` and staff record payment with *Create order*.

Local test without Twilio/Stripe:

```bash
npm run seed
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/nightly
```

### SMS and payment webhooks (step 6)

| Webhook | Verification | Handles |
| --- | --- | --- |
| `POST /api/webhooks/twilio` | `X-Twilio-Signature` (HMAC-SHA1 of URL + sorted params) | YES / NO / a number / STOP / START / HELP; anything else is flagged in the admin inbox |
| `POST /api/webhooks/stripe` | `stripe-signature` | `payment_intent.succeeded` / `.payment_failed`, `checkout.session.completed` (card saved + recovery links), `invoice.paid` / `.payment_failed`, plus the existing marketing order email |

Both are idempotent: Twilio replays are matched on `MessageSid` (unique in `sms_messages`), Stripe replays on
`event.id` (`stripe_events` table). The Twilio route always answers 200 with empty TwiML once the signature is
valid, so a retry can never double-charge; replies go out through the REST API and are recorded like any other
message. Behind a proxy, set `TWILIO_WEBHOOK_URL` to the exact public URL Twilio calls.

**What a YES does:** approves every reorder in the open prompt → charges the saved card (or sends the net-30
invoice) → texts a confirmation. A decline or authentication-required reply texts a 24-hour payment link instead
and flags the reorder under *Failed payments*.

**Local testing without a Twilio account:** set `TWILIO_DRY_RUN=1` and messages are recorded in `sms_messages`
and logged to the console instead of being sent. `scripts/dev-session-cookie.mjs` signs in as a seeded user for
curl-based checks.
