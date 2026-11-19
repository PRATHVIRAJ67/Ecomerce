# URU — Project Blueprint

> **Your Village. Your City. Your URU.**
> A premium Indian e-commerce platform: customer storefront (web + mobile), admin dashboard and super-admin console — all on one backend and one database.

---

## 1. System overview

```
                ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
                │  apps/web (Vite)     │     │  apps/mobile (Expo)  │     │  apps/admin (Vite)   │
                │  Customer storefront │     │  Customer app        │     │  Admin + Super Admin │
                └──────────┬───────────┘     └──────────┬───────────┘     └──────────┬───────────┘
                           │  Supabase Auth (email/OTP) → JWT access token             │
                           └───────────────┬────────────┴──────────────┬───────────────┘
                                           ▼  Authorization: Bearer <jwt>
                              ┌────────────────────────────────┐
                              │  apps/api  (Node + Express 5)   │  ← single source of business rules
                              │  /api/v1/catalog  (public)      │
                              │  /api/v1/me       (customer)    │
                              │  /api/v1/admin    (admin + perm)│
                              │  /api/v1/super    (super admin) │
                              └───────┬──────────────┬─────────┘
                                      │ pg (SQL,      │ S3 API (presigned PUT)
                                      │ transactions) │
                           ┌──────────▼───────┐  ┌───▼───────────────┐   ┌──────────────┐
                           │ Supabase Postgres│  │ Cloudflare R2      │   │ Razorpay     │
                           │ + RLS + triggers │  │ product/banner img │   │ online pay   │
                           └──────────────────┘  └───────────────────┘   └──────────────┘
```

**Golden rules**

1. **One backend.** Web, mobile and admin all call the same REST API. No client writes business data directly to the DB.
2. **Database-driven catalogue.** Categories, products, prices, stock, banners and settings live only in Postgres. Nothing is hard-coded in the UI.
3. **Server-side truth for money and stock.** Prices and totals are recomputed on the server inside a transaction at checkout. Clients never send prices.
4. **Transactions + row locks** (`SELECT … FOR UPDATE`) for every inventory/order mutation. A `CHECK (stock_quantity >= 0)` constraint is the final safety net.
5. **Defence in depth.** API role/permission checks → Postgres RLS (public read of active catalogue only; own rows for customer data; everything else denied to `anon`/`authenticated`).
6. **Everything auditable.** Admin mutations write to `audit_logs`; price changes go to `price_history` (trigger); stock changes go to `inventory_movements`.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Storefront | React 19 + Vite + TypeScript + Tailwind v4 (`apps/web`) |
| Admin / Super Admin | React 19 + Vite + TypeScript + Tailwind v4 + TanStack Query (`apps/admin`) |
| Mobile | React Native + Expo + TypeScript (`apps/mobile`) |
| API | Node 22 + Express 5 + TypeScript, `pg`, `zod`, `jose` (`apps/api`) |
| Database | Supabase PostgreSQL (migrations in `supabase/migrations`) |
| Auth | Supabase Auth (JWT verified by API via JWKS, or legacy HS256 secret) |
| Images | Cloudflare R2 (S3-compatible, presigned uploads straight from the admin browser) |
| Payments | Razorpay (online) + Cash on Delivery |
| Hosting | Cloudflare Pages (web, admin), API on a Node host behind Cloudflare (Workers port optional, see §9) |
| Shared code | `packages/shared` — constants, types, zod schemas, design tokens |

---

## 3. Repository layout

```
.
├── URU_PROJECT_BLUEPRINT.md      ← this file
├── TODO.md                       ← live list of unfinished work
├── package.json                  ← npm workspaces
├── supabase/
│   ├── migrations/20261119000000_uru_init.sql   ← full schema, RLS, triggers, settings
│   └── seed.sql                                  ← demo categories + products
├── packages/shared/src/
│   ├── constants.ts   roles, permissions, order statuses + allowed transitions
│   ├── types.ts       API DTOs (snake_case, identical to DB columns)
│   ├── schemas.ts     zod input schemas (used by API, reusable by clients)
│   └── tokens.ts      design tokens (colours, type, radii) for web + mobile
├── apps/api/src/
│   ├── config/env.ts          env validation + feature flags (r2, razorpay, supabaseAdmin)
│   ├── db/pool.ts             pg pool + withTransaction()
│   ├── middleware/auth.ts     JWT verify, profile load, requireStaff/requireSuperAdmin/requirePermission
│   ├── lib/                   http errors, audit, r2, razorpay, settings, sql helpers
│   ├── services/orders.ts     checkout, cancel, transitions, payment confirm, expiry release
│   └── routes/                catalog, account, admin/*, super
└── apps/admin/src/            dashboard, products, categories, inventory, orders, customers, banners, super-admin
```

---

## 4. Data model (Postgres)

| Table | Purpose |
|---|---|
| `profiles` | 1:1 with `auth.users`. `role` (customer/admin/super_admin), `status` (active/suspended), `permissions text[]` |
| `categories` | Dynamic, nestable (`parent_id`), sortable, activatable |
| `products` | Price, MRP, stock, low-stock threshold, `marked_out_of_stock`, `is_active`, `is_featured`, unit, origin, tags. Soft delete (`deleted_at`) |
| `product_images` | Ordered images (R2 URLs) |
| `price_history` | Auto-filled by trigger on price/MRP change |
| `inventory_movements` | Every stock change: initial, order, order_cancelled, restock, adjustment, correction |
| `banners` | Home hero / strip / category banners with schedule |
| `addresses` | Customer addresses (pincode validated) |
| `cart_items`, `wishlist_items` | Server-side → cart & wishlist sync across web and mobile |
| `orders`, `order_items` | Order snapshot (prices, names, address frozen at purchase) |
| `order_status_history` | Order tracking timeline |
| `audit_logs` | Who did what, before/after JSON |
| `platform_settings` | Key/value JSON (shipping fee, free-shipping threshold, COD limits, store info …) |

**Purchasable** = `is_active AND NOT marked_out_of_stock AND stock_quantity > 0 AND deleted_at IS NULL` — enforced in the checkout transaction, not just the UI.

**Order lifecycle**

```
COD:      confirmed → packed → shipped → out_for_delivery → delivered
Razorpay: pending_payment ─(signature verified)→ confirmed → …
Any of pending_payment / confirmed / packed → cancelled  (stock returned in the same transaction)
pending_payment older than payment_timeout_minutes → auto-cancelled, stock released (API job)
```

---

## 5. Auth & authorization

* Sign-in/sign-up happens on the client with Supabase Auth. A DB trigger creates a `profiles` row (role **customer**) for every new auth user. **Role is never read from user metadata.**
* API verifies the JWT (`iss = <SUPABASE_URL>/auth/v1`, `aud = authenticated`) using the project JWKS (asymmetric keys) or `SUPABASE_JWT_SECRET` (legacy HS256), then loads the profile on every request. Suspended accounts are rejected immediately.
* **Admin permissions** (granted per admin by the super admin):

| Permission | Allows |
|---|---|
| `products.manage` | Create/edit/delete products, images |
| `prices.manage` | Change price / MRP |
| `inventory.manage` | Stock set/adjust, mark out-of-stock, inventory report |
| `categories.manage` | Category CRUD |
| `orders.manage` | View orders, move status, cancel |
| `customers.view` | Customer list & details |
| `banners.manage` | Banner CRUD |
| `analytics.view` | Dashboard & sales analytics |

* **Super admin** implicitly has every permission plus: manage admins (create, suspend, permissions, remove), platform settings, audit logs, global analytics, suspend any user.

**Bootstrap the first super admin** (after signing up once through any client or Supabase dashboard):

```sql
update public.profiles set role = 'super_admin', permissions = '{}' where email = 'you@yourdomain.com';
```

---

## 6. API surface (`/api/v1`)

| Area | Endpoints |
|---|---|
| Public | `GET catalog/home`, `catalog/categories`, `catalog/products?q&category&sort&page&min_price&max_price&in_stock&featured`, `catalog/products/:slug`, `catalog/banners`, `catalog/settings` |
| Customer | `GET/PATCH me`, `me/addresses` CRUD, `GET/PUT/DELETE me/cart[/:productId]`, `POST me/cart/merge`, `GET/PUT/DELETE me/wishlist[/:productId]`, `POST me/checkout`, `GET me/orders[/:id]`, `POST me/orders/:id/cancel`, `POST me/orders/:id/pay`, `POST me/orders/:id/verify-payment` |
| Admin | `GET admin/me`, `admin/analytics/dashboard`, `admin/products` CRUD + `PATCH :id/price`, `POST :id/stock`, `PATCH :id/availability`, `GET :id/price-history`; `admin/categories` CRUD; `admin/inventory/report`, `admin/inventory/movements`; `admin/orders`, `admin/orders/:id`, `PATCH admin/orders/:id/status`; `admin/customers[/:id]`; `admin/banners` CRUD; `POST admin/uploads/presign` |
| Super admin | `super/overview`, `super/admins` (GET/POST/PATCH/DELETE, `:id/suspend`, `:id/activate`), `PATCH super/users/:id/status`, `GET/PUT super/settings`, `GET super/audit-logs` |
| Webhooks | `POST payments/razorpay/webhook` (raw body, signature verified) |

Errors are always `{ "error": { "code", "message", "details?" } }`. JSON keys are **snake_case** everywhere (same as DB and Supabase), so types are shared 1:1.

---

## 7. Cross-platform sync

* Single API + single DB ⇒ a price/stock/category change made in admin is what web and mobile read on their next request.
* Clients use TanStack Query with short `staleTime` + refetch on focus. Cart and wishlist are server-side, so they follow the user across devices.
* `products`, `categories`, `banners` are added to the `supabase_realtime` publication — clients can subscribe for instant updates (public rows only, guarded by RLS).

---

## 8. Design system

| Token | Value | Use |
|---|---|---|
| Forest Green | `#174D38` | Primary brand, sidebar, primary buttons |
| Terracotta | `#D97745` | Accent, CTAs, highlights, active nav |
| Cream | `#FAF7F0` | App background |
| White | `#FFFFFF` | Cards, surfaces |
| Ink | `#1D2722` | Body text |
| Line | `#E6E0D2` | Warm borders |

* Type: **Fraunces** (display, headings — artisanal premium feel) + **Inter** (UI/body).
* Radius 12–24px, soft warm shadows, generous spacing (8px grid), tabular numbers for prices.
* Source of truth: `packages/shared/src/tokens.ts` (mobile) mirrored as Tailwind `@theme` tokens in each web app's `index.css`.

---

## 9. Environments & deployment

| Piece | Where |
|---|---|
| DB + Auth | Supabase project (run the migration, then `seed.sql` for demo data) |
| Images | R2 bucket with public custom domain; CORS allowing `PUT` from admin origin |
| API | Any Node 22 host (Render/Railway/Fly/VM) proxied through Cloudflare. Optional later: Cloudflare Workers with `nodejs_compat` + Hyperdrive |
| Admin & Web | Cloudflare Pages (`npm run build -w @uru/admin` → `apps/admin/dist`) with SPA fallback |
| Mobile | Expo EAS Build |

### Local setup

```bash
npm install
# 1. Supabase: create a project → SQL editor → run supabase/migrations/*.sql, then supabase/seed.sql
#    (or: npx supabase link && npx supabase db push)
# 2. Copy env files
cp apps/api/.env.example apps/api/.env       # DATABASE_URL, SUPABASE_URL, keys …
cp apps/admin/.env.example apps/admin/.env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
# 3. Create your user (Supabase dashboard → Auth → Add user), then promote it (SQL in §5)
npm run dev:api     # http://localhost:4000/health
npm run dev:admin   # http://localhost:5174
```

### R2 CORS (bucket → Settings → CORS)

```json
[{ "AllowedOrigins": ["http://localhost:5174", "https://admin.yourdomain.com"],
   "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
```

---

## 10. Build order / roadmap

1. ✅ Blueprint, monorepo, shared package, design tokens
2. ✅ Database schema, RLS, triggers, settings, seed
3. ✅ API: auth/RBAC, catalogue, admin, super admin, cart, wishlist, checkout (transactional), orders, Razorpay
4. ✅ Admin dashboard (products CRUD, pricing, inventory, orders, customers, banners, super-admin)
5. ⏭ Customer website (`apps/web`) — see `TODO.md`
6. ⏭ Mobile app (`apps/mobile`, Expo) — reuses `@uru/shared` types + tokens and the same API
7. ⏭ Hardening: tests, webhooks/refunds, observability, CI/CD to Cloudflare
