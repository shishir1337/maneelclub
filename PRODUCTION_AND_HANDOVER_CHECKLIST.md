# Production Quality & Client Handover Checklist

**Last reviewed:** February 2025  
**Purpose:** Everything that is done vs. left so the app is production-ready and the client can launch and operate the business.

---

## ✅ What Is Already Production-Ready

| Area | Status |
|------|--------|
| **Shop** | Homepage (hero from admin), categories, product list/detail, cart (Zustand), checkout, order confirmation |
| **Auth** | Better Auth: sign up, sign in, session, roles (CUSTOMER/ADMIN). **Rate limiting** on sign-in/sign-up (Better Auth built-in, DB-backed). |
| **Guest checkout** | Checkout allowed without login; orders stored with `userId: null` |
| **Payments** | COD + bKash/Nagad/Rocket; admin can verify/reject mobile payments |
| **Customer dashboard** | Profile, addresses CRUD, order history with order details, recent orders on dashboard home |
| **Admin** | Dashboard, orders (list/detail/filter, payment verify), products CRUD (variants, images), categories, attributes, customers, Hero Slider, Cities, Settings, Analytics, invoice print |
| **Route protection** | **Layout-level:** `/admin` requires session + role ADMIN; `/dashboard` requires session. Unauthenticated users redirect to sign-in. |
| **Checkout security** | Server-side price resolution and stock validation in `createOrder`; no client-supplied prices used. See AUDIT_REPORT.md. |
| **Error handling** | `error.tsx` (Try again / Home), `not-found.tsx` (branded 404) |
| **Legal & support** | Privacy, Terms, About, Returns, Contact, FAQ, Shipping info |
| **SEO** | Root metadata; `generateMetadata` on product, category, shop, key pages. **robots.txt** and **sitemap.xml** (dynamic: products, categories, static pages). |
| **Loading / UX** | Route-level `loading.tsx` and skeletons across shop, admin, dashboard |
| **Tech** | Prisma + PostgreSQL, MinIO/local uploads, `.env.example` with all vars documented |
| **Tracking (GTM + Meta)** | Data layer (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase). GTM and Meta Pixel configurable in Admin → Settings → Tracking. Purchase sends `event_id` for CAPI deduplication. |

---

## 🔴 Known Limitation (Not a Blocker)

- **Track Order (public):** Footer "Track Order" is removed. Logged-in users see order status via **My Orders** → **View details**. A public track-order page (order number + phone) can be added later if needed.

---

## 🟠 Before First Production Deploy

### 1. Environment variables (production)

Set these in your hosting dashboard (e.g. Vercel, Railway):

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Generate with `npx @better-auth/cli secret`; never commit |
| `BETTER_AUTH_URL` | Yes | Full production URL, e.g. `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as BETTER_AUTH_URL (used for links, sitemap, auth) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Yes | e.g. `+8801997193518` |
| `MINIO_*` | No | Only if using MinIO; otherwise uploads go to `public/uploads` |
| `META_PIXEL_ID` / `META_CAPI_ACCESS_TOKEN` | No | For Meta Conversions API server-side Purchase |

- Ensure the app is served over **HTTPS**.
- After deploy, add the production domain to Better Auth trusted origins if you use a separate config (default uses `NEXT_PUBLIC_APP_URL`).

### 2. Database

- Run migrations: `pnpm prisma migrate deploy` (or your host’s build command that runs it).
- Optional: seed data with `pnpm run db:seed` if you have a seed script.

### 3. Admin setup after first deploy

- Create the first admin user (sign up then set `role = 'ADMIN'` in DB, or use your seed).
- In **Admin → Settings**: set shipping rates, merchant numbers (bKash/Nagad/Rocket), WhatsApp, GTM container ID, Meta Pixel ID if used.
- In **Admin → Hero**: add hero slides.
- In **Admin → Cities**: ensure delivery areas/cities are loaded.

### 4. README (recommended)

- Update README with: project name, one-line description, `pnpm install` / `pnpm dev`, copy `.env.example` to `.env.local`, required env list, `pnpm prisma migrate deploy`, `pnpm build` / `pnpm start`, and a short deployment note (e.g. Vercel + Postgres).

---

## 🟡 Optional (Post-Launch)

- **Rate limiting for createOrder:** Better Auth rate limits only auth routes. To limit checkout abuse, add custom rate limiting for the order-creation endpoint (e.g. per IP).
- **Security headers:** CSP, X-Frame-Options via next.config or host.
- **Centralized logging:** Replace `console.error` in catch blocks with a logger and, in production, send errors to a service (e.g. Sentry).

---

## Final Pre-Deploy Checklist (run through before handover)

- [ ] `.env` / production env: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` set for production.
- [ ] `pnpm build` succeeds (no TypeScript or build errors).
- [ ] `pnpm prisma migrate deploy` run against production DB (migrations up to date, including `rateLimit` table if using Better Auth rate limit).
- [ ] First admin user exists; Admin → Settings (shipping, merchant numbers, tracking) and Hero/Cities configured.
- [ ] Test: place a guest order end-to-end (checkout → order confirmation → order visible in Admin).
- [ ] Test: sign in as customer, view orders and profile.
- [ ] Test: sign in as admin, view orders, products, and settings.
- [ ] Production URL is HTTPS; auth works (sign-in/sign-up redirect and session).
- [ ] If using Meta/GTM: GTM container ID and/or Pixel ID set in Admin → Settings; test that key events (e.g. Purchase) appear in Meta/GTM as expected.

---

## Summary

| Item | Status |
|------|--------|
| Stock/price validation at checkout | ✅ Done (server-side in createOrder) |
| Route protection (admin/dashboard) | ✅ Done (layout-based auth check) |
| Rate limiting (auth) | ✅ Done (Better Auth built-in, DB storage) |
| Sitemap + robots.txt | ✅ Done (sitemap.xml dynamic; robots.txt in place) |
| Data layer (GTM + Meta) | ✅ Done (events + currency + event_id for Purchase) |
| Track Order (public) | Deferred (users use My Orders) |
| README + env/deploy notes | Recommended before handover |
| Production env checklist | In this doc and .env.example |

The application is **ready for production deployment and client handover** once the environment variables are set, migrations are applied, and the first admin has configured Settings, Hero, and Cities.
