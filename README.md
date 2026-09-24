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

## Cup Casa OS

Full spec: [`docs/SPEC.md`](docs/SPEC.md). Built in the order the spec sets out, not all at once.

### Module 1 — Switch ROI calculator ✅

Public, no auth, no database. `/calculator`.

| Piece | Where |
| --- | --- |
| Formulas (pure, unit-tested) | `src/lib/calc/roi.ts`, `src/lib/calc/money.ts` |
| Tests — run `npm test` | `src/lib/calc/roi.test.ts` (26 cases) |
| Cup prices | `src/lib/calc/catalog.ts`, sourced from the catalogue, never hard-coded |
| Survey figures + method note | `src/lib/calc/survey.ts` |
| UI | `src/components/calculator/switch-calculator.tsx` |
| Emailed breakdown PDF | `src/lib/pdf/roi-breakdown.tsx` |
| Lead capture | `src/app/api/calculator/lead/route.tsx` |

Money is integer cents throughout `lib/calc`; `toCents` converts through the decimal string so
`0.145` rounds to 15¢ rather than 14¢, and throws rather than silently yielding 0.

**Acceptance rate.** The spec's table says the headline defaults to 1.0, and its standing rule says
never to model above the measured figure. Those conflict, so the default is the measured **0.98**
(163 of 167), with the conservative 0.90 behind a checkbox. `calculateRoi` clamps anything higher.

**Losses are shown, not hidden.** When the honest answer is negative, `isNetLoss` is set and both the
page and the PDF reframe rather than printing a red number. The arithmetic is never adjusted.

Preview the PDF while editing the template (development only):
`/api/dev/pdf/roi` and `/api/dev/pdf/roi-loss`.

### Module 5 — Compliance Center: WorkSafe binder ✅

Gated asset at `/compliance`. Works with zero customers and no database.

| Piece | Where |
| --- | --- |
| SDS registry (JSON, not PDFs) | `content/sds/registry.json` |
| Registry loader, BC 3-year review rule | `src/lib/compliance/sds.ts` |
| Café hazards + orientation topics | `src/lib/compliance/hazards.ts` |
| Mandatory disclaimer | `src/lib/compliance/disclaimer.ts` |
| Binder PDF (9 sections) | `src/lib/pdf/worksafe-binder.tsx` |
| QR generation | `src/lib/compliance/binder.ts` |
| Generate + email (gated) | `src/app/api/compliance/binder/route.tsx` |
| Nightly link check | `src/app/api/cron/sds-check/route.ts`, scheduled in `vercel.json` |

**Sheets are indexed, never mirrored.** Each product carries the manufacturer's SDS page, plus a direct
link only where a human has confirmed it is the sheet for that exact product. Products we can't link
(bleach, sanitizer, dish detergent — brand varies by café) still appear on the hazard inventory, with
a line telling the café who to ask. They never see a dead link: broken ones alert us, not them.

**The BC three-year review rule** is the hook. Every binder is stamped with its own review date.

### Module 6 — Compliance Center: claims, signage, health, grants ✅

All four live on the same page, under one sentence: the paperwork a café is supposed to have.

| Tool | Route | Notes |
| --- | --- | --- |
| WHMIS binder | `POST /api/compliance/binder` | 9 sections, QR-coded SDS index |
| Claims & greenwashing kit | `POST /api/compliance/claims` | approved language, claims to avoid, substantiation page |
| Bin signage | `POST /api/compliance/signage` | BOH poster, bin decals, staff briefing |
| Health self-audit | `POST /api/compliance/audit` | Island Health / BC Food Premises walk-round |
| Grants | rendered on the page | `content/grants.json`, auto-hidden after two unverified quarters |

Content and data live in `content/` and `src/lib/compliance/`; PDF templates share `src/lib/pdf/theme.ts`.
Each document carries the disclaimer that actually applies to it (`DISCLAIMERS` in
`src/lib/compliance/disclaimer.ts`), not one generic line.

**The bin signage tells the truth about the green bin.** The CRD organics programme does not accept
compostable containers, so the signage says to compost at home and explicitly not to use the green
bin. Claiming otherwise would be a greenwashing exposure for Cup Casa, not just the café.

**Nothing asserts a per-municipality accept list.** `content/municipalities.json` carries verified
municipal links and the regional position; we don't restate rules we can't keep current.

Preview without filling the form (development only): `/api/dev/pdf/binder`.

⚠️ **Before any of this is promoted**: the WorkSafe content needs a BC safety consultant's review pass
and the claims kit needs a lawyer's, both recorded per the spec's `content_versions.reviewed_by`.
The page says so in plain language today.

### Module 7 — Brand kit generator ✅

`/brand`. Upload a logo, pick a colour and one of six templates, download the set. Stateless: nothing
is stored, so account #100 costs no more labour than account #1.

| Piece | Where |
| --- | --- |
| Logo analysis (resolution, palette, mono) | `src/lib/brand/analyze.ts` — sharp |
| Six templates | `src/lib/brand/templates.tsx` |
| JSX → SVG → PNG | `src/lib/brand/render.ts` — satori + resvg, no headless browser |
| Print pieces at trim with bleed + crop marks | `src/lib/pdf/brand-print.tsx` |
| Dielines as data | `src/lib/brand/dielines.ts` |
| Upload / generate | `src/app/api/brand/analyze`, `src/app/api/brand/kit` (ZIP) |

Ships: three Instagram assets, a menu chip, window decal, till card, A-frame poster, and the
single-colour logo — zipped with a README naming each trim size.

**Sleeves are deliberately absent.** A sleeve has its own trim, seam allowance and cone warp.
`DIELINES.sleeve12.confirmed` is `false` until the supplier sends theirs in writing; generating
against a guessed dieline is how you print 5,000 unusable sleeves. Set the numbers and flip the flag
and the template slots in.

`satori`, `sharp` and `@resvg/resvg-js` are in `serverExternalPackages` — Turbopack can't bundle the
native binaries or the harfbuzz wasm.
