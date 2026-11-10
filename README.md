# WearWise AI

**Your Style. Your Budget. Your AI Stylist.**

WearWise AI is a premium fashion-discovery storefront: an editorial catalogue of men's, women's and streetwear pieces with a stylist that assembles complete, budget-aware outfits from real products, explains every choice, and sends shoppers to the retailer with tracked affiliate links. No payments are processed on this site.

---

## What's inside

| Area | What works |
| --- | --- |
| **Home** | Hero with “Find My Style” / “Explore Collection”, 6 categories, trending, new arrivals, AI promo, outfit combos, testimonials, newsletter |
| **Catalogue** | 51 seeded products across 12 brands and 10 categories, INR pricing and MRP, `₹` formatting, gallery-ready product records |
| **Shopping** | Filters (category, brand, colour, style, price range), sorting, natural-language search, wishlist, bag with sizes and quantities, affiliate checkout |
| **AI Stylist** | Gender, occasion, style, budget (presets or custom), season, fit, colours, categories, free-text brief → three complete looks with per-item reasoning, totals, budget remaining, regenerate, refine, save |
| **AI Assistant** | Free-form styling chat with product grounding and a deterministic fallback |
| **Smart Closet** | Digitise your wardrobe with photo uploads, generate outfits from the clothes you own, find missing pieces, optimise a shopping budget, plan the week and chat to a wardrobe-aware stylist |
| **Accounts** | Email/password signup and login, preferences, saved looks, wishlist, AI/activity history, settings |
| **Admin** | Overview stats, product CRUD with image upload, category/brand management, affiliate URL and sponsored flags, users, AI usage, clicks, estimated revenue |
| **Affiliate** | `/go/:id` logs the click, then 307-redirects to the retailer with UTM tags; disclosure on every relevant page |
| **Content** | About, contact (stored server-side), privacy, terms, affiliate disclosure, 404, error boundary, sitemap, robots |

## Tech stack

- **Next.js 15** (App Router, React 19, server components + route handlers)
- **TypeScript** (strict) and **Tailwind CSS 3.4** — hand-built design system, no component library
- **lucide-react** icons
- **Node.js** file-backed JSON store (`data/store.json`) — zero external services required
- **Google Gemini** (optional, server-side) for live AI; a deterministic styling engine is always available

## Quick start

Requirements: Node.js 20+ (Next 15 needs at least 18.18) and npm.

```bash
npm install
cp .env.example .env.local   # optional — the app runs without it
npm run dev
```

Open <http://localhost:3000>. On first request the store is created at `data/store.json` with the full catalogue, categories, brands and demo accounts.

If port 3000 is taken:

```bash
npm run dev -- -p 3210
```

Other scripts:

```bash
npm run build      # production build (includes Next's type check)
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@wearwise.ai` | `Admin@12345` |
| Customer | `demo@wearwise.ai` | `Demo@12345` |

Admin access lives at `/admin`. Sign in as the customer to see the account dashboard at `/account`.

> These are development seeds. Change or remove them before any public deployment.

## Environment variables

Everything is optional for local development. Copy `.env.example` to `.env.local`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | Production | Signs the HMAC session cookie. Any long random string. A development fallback is used if unset — never ship with it. |
| `GEMINI_API_KEY` | No | Enables live Gemini recommendations. Server-side only; never bundled to the browser. Without it the built-in engine is used and the UI says so. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash`. |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical origin used for page metadata, the sitemap and robots.txt. Defaults to `http://localhost:3000`. |
| `WEARWISE_DATA_DIR` | No | Overrides where `store.json` is written. Useful when the app directory is read-only. |
| `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY` | No | Placeholders for a Supabase migration. See [Moving to Supabase](#moving-to-supabase-postgres). Not read by the current code. |

## How the AI stylist works

```
brief (audience, budget, occasion, style, season, fit, colours, categories, notes)
        │
        ├── GEMINI_API_KEY set? ──► Gemini prompt with the live catalogue injected
        │                             (ids, prices, stock, colours, occasions)
        │                                   │
        │                                   ▼
        └──────────── no key ─────► deterministic engine in src/lib/recommend.ts
                                            │
                                            ▼
                         validation in src/lib/recommend.ts
        only real product ids · complete outfits (top + bottom + shoes where
        available) · total never above budget · no duplicate pieces across looks
                                            │
                                            ▼
              /ai-stylist/results — items, brands, colours, sizes, prices,
              totals, budget remaining, rationale, styling tip, Shop / Save / Regenerate
```

- Budget is treated as a hard ceiling: the engine picks the best-fitting complete look it can assemble under it (a ₹1,000 brief yields a real outfit, not an error).
- Gemini output is never trusted blindly — unknown products, over-budget totals and incomplete looks are discarded in favour of the local engine.
- Chat requests are logged to `aiHistory` for the admin dashboard and the customer's activity tab.
- The API keys stay on the server; `/api/ai/*` is the only place Gemini is called.

## Smart Closet & budget intelligence

`/closet` is the wardrobe workspace, guarded by the same session as `/account`. Every number it shows is derived from your own items and the live catalogue — no invented products.

- **Wardrobe** — add pieces manually or with a JPG/PNG/WEBP photo (magic-byte checked, 6 MB limit, stored under `public/uploads/wardrobe/<user>/`). Category is suggested from the item name, and every field can be edited. Search, filter by category/colour, sort, edit and delete are supported; deleting a piece also removes its photo and prunes it from saved outfits.
- **AI outfit generator** — pick occasion, style, colour, season, fit preference and outfit type. The engine builds up to three looks only from wardrobe items, shows each item's price, a wardrobe-match score with a plain-English “why they match”, occasion suitability and styling tips. You can regenerate, swap individual pieces, build a custom mix, save and favourite looks.
- **Missing pieces** — scores catalogue products against your wardrobe (category need, compatible pieces, new combinations, price efficiency, occasion range) and explains the score. Items you already own in the same slot and colour are excluded.
- **Budget optimizer** — presets (₹500 / ₹1,000 / ₹2,000 / ₹5,000) or a custom budget. It prefers garments that unlock complete outfits, calculates running totals and remaining budget, and links to the retailer.
- **Style assistant** — answers questions such as “what should I wear to college?”, “what matches my black jeans?”, “what should I buy under ₹1,000?” and “what's missing?”. It uses pairing rules over your real wardrobe (labelled as the WearWise wardrobe engine), so it keeps working without an AI key.
- **Saved & planned** — save looks, favourite them, group them into collections, and fill a seven-day planner. Repeats within the week are flagged.

Combination counts and versatility scores are estimates from transparent rules (slot coverage, colour harmony, season and style overlap). They are not machine-learning predictions, and the UI says so.

## Data and persistence

- **Server data:** `data/store.json` holds users, products, categories, brands, saved outfits, AI history, affiliate clicks, contact messages, newsletter signups, password-reset tokens and the Smart Closet (wardrobe items, saved wardrobe outfits, collections and planner entries). Writes are atomic (temp file + rename) and cached by mtime.
- **Seeding:** on first run, and again whenever `SEED_VERSION` in `src/lib/db.ts` is bumped, missing seed products are merged in without overwriting admin edits.
- **Reset:** delete `data/store.json` and restart/refresh. Everything is recreated, including the two demo users.
- **Browser data:** bag, wishlist and guest “saved looks” live in `localStorage`. Account-saved outfits are server-side.
- **Uploads:** admin product images go to `public/uploads/` and wardrobe photos to `public/uploads/wardrobe/<user>/` (both git-ignored). Wardrobe photos are only readable by URL and are deleted with their item.
- `data/store.json` and `public/uploads` are git-ignored so customer data never lands in version control.

## Project layout

```
src/
  app/
    page.tsx                 home
    shop/ women/ men/ streetwear/ new-in/
    product/[slug]/          product detail (server-rendered)
    search/                  natural-language search results
    ai-stylist/              brief form, results, assistant
    closet/                  Smart Closet workspace (wardrobe, outfits, budget, planner)
    cart/ checkout/ wishlist/
    login/ signup/ forgot-password/ reset-password/
    account/                 six-tab dashboard (auth-guarded)
    admin/                   dashboard, products, affiliate, taxonomy, users, analytics
    api/                     route handlers (see below)
    go/[id]/                 affiliate click logging + 307 redirect
    about/ contact/ privacy/ terms/ affiliate-disclosure/
  components/
    ui.tsx                   design-system primitives
    closet/                  wardrobe manager, outfit studio, missing items, budget, assistant, planner
  lib/
    seed.ts                  51 products, taxonomy, demo users, starter wardrobe
    wardrobe.ts              wardrobe rules, outfit generation, scores, budget and assistant logic
    closet.ts                shared closet tab definitions
    db.ts                    JSON store, seeding, migrations, queries
    auth.ts crypto.ts        scrypt hashing, signed httpOnly sessions, guards
    recommend.ts             stylist engine, outfit validation, budget parsing
    gemini.ts                optional Gemini client
    search.ts search-intelligence.ts   catalogue search, NL query parsing
    product-input.ts         admin product validation
supabase/schema.sql          reference Postgres schema (not wired to the app)
```

### API routes

| Method + path | Purpose |
| --- | --- |
| `POST /api/auth/signup`, `/login`, `/logout`, `GET /api/auth/me` | Session lifecycle |
| `POST /api/auth/forgot-password`, `/reset-password` | Token-based reset (dev returns the link, production does not) |
| `POST /api/ai/stylist`, `/api/ai/chat` | Stylist and chat |
| `GET /api/search/suggest` | Search suggestions |
| `GET/POST/DELETE /api/outfits` | Saved looks (auth) |
| `GET/POST /api/wardrobe`, `PATCH/DELETE /api/wardrobe/:id` | Wardrobe CRUD (auth, owner-scoped) |
| `POST /api/wardrobe/upload` | Wardrobe photo upload (auth, JPG/PNG/WEBP, 6 MB) |
| `POST /api/wardrobe/generate` | Outfits from wardrobe items |
| `GET/POST /api/wardrobe/outfits`, `PATCH/DELETE /api/wardrobe/outfits/:id` | Saved wardrobe outfits and favourites |
| `POST /api/wardrobe/swap` | Replace one piece in a generated look |
| `POST /api/wardrobe/insights` | Missing-piece analysis or budget plan |
| `POST /api/wardrobe/assistant` | Wardrobe-aware styling answers and outfit cards |
| `GET/POST/DELETE /api/wardrobe/planner` | Seven-day outfit planner |
| `GET/POST/PATCH/DELETE /api/wardrobe/collections` | Outfit collections |
| `PATCH /api/account/preferences` | Style preferences (auth) |
| `POST /api/newsletter`, `/api/contact` | Marketing and support inboxes |
| `GET /go/:id` | Log affiliate click → 307 to retailer |
| `POST/PATCH/DELETE /api/admin/products[/:id]` | Product CRUD (admin) |
| `PATCH /api/admin/affiliate` | Affiliate URL + sponsored flag (admin) |
| `POST/DELETE /api/admin/taxonomy` | Categories and brands (admin) |
| `POST /api/admin/upload` | Image upload (admin) |

## Auth and security

- Passwords are hashed with Node's `scrypt` and a per-user salt; hashes never leave the server.
- Sessions are HMAC-signed, `httpOnly`, `sameSite=lax` cookies; `AUTH_SECRET` should be set in production.
- `/admin` and `/account` are guarded in server layouts, and every admin API re-checks the session — a hidden button is never the only protection.
- No secret is exposed to client bundles; the Gemini key is read only inside route handlers.
- Affiliate redirects are validated against stored products and log the click before redirecting.

## Affiliate model

1. Every product carries a `retailer` and an `affiliateUrl` built with `utm_source=wearwise`.
2. “Shop at retailer” points at `/go/:id`, which records product, optional signed-in email, source and timestamp, then redirects with a 307.
3. Cart/checkout explains that purchase completes on the partner site — the app takes no payment and never collects card data.
4. Admin → Affiliate lets you replace any URL, mark sponsored products and see clicks; Admin → Analytics aggregates clicks, AI requests and estimated commission.
5. The footer and `/affiliate-disclosure` carry the disclosure on every page.

## Moving to Supabase (Postgres)

`supabase/schema.sql` is a **reference migration**, not part of the running app. It mirrors `src/lib/types.ts` table for table, with enums, foreign keys, indexes, a `profiles` table linked to `auth.users`, an `is_admin()` helper, a new-user trigger and Row Level Security on every table (public catalogue, owner-only outfits and history, admin-only writes and inboxes).

To adopt it:

1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
2. Promote your admin: `update public.profiles set role = 'admin' where id = '<auth-user-uuid>';`
3. Add the three Supabase variables to `.env.local`.
4. Replace the query functions in `src/lib/db.ts` with Supabase calls (the rest of the app only depends on those functions), swap `src/lib/auth.ts` sessions for Supabase Auth, and move `/api/admin/upload` to Supabase Storage.

Until then, the JSON store is the source of truth and no Supabase code runs.

## Deployment notes

The app writes to disk, so it needs a **Node server with a persistent volume** (Render, Fly.io, Railway, a VPS, Docker, etc.):

```bash
npm ci
npm run build
AUTH_SECRET="$(openssl rand -base64 32)" NEXT_PUBLIC_SITE_URL="https://your-domain.com" npm start
```

Checklist:

- Set `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`.
- Make `data/` (or `WEARWISE_DATA_DIR`) writable by the app user and included in backups.
- Remove or replace the seeded demo accounts; there is no in-app password-change screen, so change `SEED_ADMIN`/`SEED_CUSTOMER` in `src/lib/seed.ts` (or edit the store) before launch.
- Put a reverse proxy (Caddy, nginx) in front for TLS. The app itself has no TLS.
- Configure an email provider if you want password-reset links mailed; as shipped, dev returns the link from the API and production omits it.
- Serve `public/uploads` from the same persistent volume.

**Serverless caveat:** Vercel/Netlify functions have an ephemeral filesystem — `data/store.json` and uploads would be lost between invocations. Migrate to Supabase (above) or another external database/storage before deploying there. Also note the JSON store assumes a single app instance; running several replicas against one file is not safe.

## Verification performed

- `npm run build` completes; `npx tsc --noEmit` is clean.
- Public routes return 200; `/admin` and `/account` 307 to `/login` when signed out; unknown product slugs 404.
- Auth: login, signup 201, duplicate email 409, logout; forgot-password issues a reset token.
- Admin: unauthenticated product creation 403; authenticated create and delete succeed.
- Stylist API: complete looks inside ₹1,000, ₹2,000–₹5,000, wedding and streetwear briefs, never above the stated budget.
- Affiliate redirect `/go/p001` returns 307 to the retailer with UTM tags; newsletter and contact submissions persist.
- Smart Closet: signed-out `/closet` redirects to login and returns to the closet after sign-in; wardrobe CRUD, photo upload (and rejection of disguised files), outfit generation, swapping, saving/favouriting, collections, missing-piece analysis, budget plans at all presets, all six assistant intents and the planner were exercised through the APIs; two accounts cannot read or delete each other's wardrobe items.
- Layout checked at 1440px, 1024px, 800px and 390px with no horizontal overflow; empty states verified for a wardrobe-less account.

Caveat: the affiliate URLs are retailer **search** links with tracking parameters (Myntra, Ajio, Amazon), not per-product deep links, and every price, rating and stock figure is fictional demo data.

## Known limitations

- **No payments or fulfilment** — checkout is an explanation plus tracked links, by design.
- **No transactional email** — newsletter and contact messages are stored; nothing is sent. Password reset links are returned in development and omitted in production.
- **JSON store** — fine for a demo or single-instance deployment, not for concurrent writers at scale; see the Supabase path.
- **AI fallback is deterministic**, so repeated identical briefs give identical looks until preferences change. Adding `GEMINI_API_KEY` varies the styling language.
- **Smart Closet scoring is rule-based**, not machine learning: combination counts and versatility scores are transparent estimates that can differ from how a person would weigh the same wardrobe. The assistant is likewise grounded in pairing rules rather than a live language model.
- **Wardrobe photos are local files.** They work on a single Node host with a persistent volume; serverless deployment would need object storage (the Supabase migration below is the starting point).
- **Images** are locally cached Pexels photographs for demonstration. Check licensing before commercial use.

## Credits

Product photography from [Pexels](https://www.pexels.com) (free to use under the Pexels license), stored locally in `public/products/`. Typefaces served by `next/font`. Built as a portfolio project — WearWise AI is not a real retailer.
