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
