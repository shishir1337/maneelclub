# Production Readiness Audit – Maneel Club E‑commerce

This document lists what’s done, what’s left, and what to do before handover so the site is production‑quality.

---

## ✅ What’s Already Done

- **Shop**: Homepage, categories, product listing, product detail, cart (Zustand), checkout with COD + bKash/Nagad/Rocket, order confirmation with correct payment message.
- **Auth**: Sign up, sign in (Better Auth), session, role (CUSTOMER/ADMIN).
- **Customer**: Profile (name, phone, password change, delete account), addresses CRUD + default, order history; dashboard with quick links.
- **Admin**: Dashboard, orders (list, detail, status, payment verify/reject), products (CRUD, variants, images), categories, attributes, customers (real DB + stats), settings (persisted), analytics (charts), invoice print.
- **Tech**: Prisma + PostgreSQL, MinIO uploads, env-based config, server actions with auth checks, Decimal serialization for client.
- **Data layer (Meta Pixel / Conversion API)**: A data layer is implemented and events are pushed for:
  - **PageView** – on every route change (via `DataLayerProvider`).
  - **ViewContent** – on product detail page (product id, name, value).
  - **AddToCart** – when user adds an item (content_ids, value, num_items).
  - **InitiateCheckout** – when checkout page is shown with items (value, num_items, content_ids).
  - **Purchase** – on order confirmation page (order_id, value, num_items, content_ids, **event_id** for deduplication).
  - Events use standard Facebook event names and parameters so Meta Pixel and Conversion API can use them. The app pushes to `window.dataLayer`; install the Meta Pixel base code (in layout or via GTM) and pass **event_id** as eventID for Purchase so Meta can deduplicate with server events.
- **Meta Conversions API (server-side)**: Purchase events are sent from the server after order creation (`src/lib/conversions-api.ts`, called from `createOrder` in `src/actions/orders.ts`). Uses hashed email/phone, client IP, and user-agent. Set `META_PIXEL_ID` and `META_CAPI_ACCESS_TOKEN` in env; if unset, server events are skipped. Use the same **event_id** (order number) in both Pixel and API for deduplication.

---

## 🔴 Critical (Must Fix Before Handover)

### 1. **Address model missing `createdAt`**
- **Issue**: `src/actions/addresses.ts` uses `orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]` but the `Address` model in `prisma/schema.prisma` has no `createdAt` field.
- **Impact**: Loading addresses in dashboard will throw a Prisma error.
- **Fix**: Add `createdAt DateTime @default(now())` (and optionally `updatedAt`) to the `Address` model, then run `pnpm prisma db push` (or a migration).

### 2. **Route protection for `/admin` and `/dashboard`**
- **Issue**: No proxy (formerly middleware). Anyone can open `/admin` or `/dashboard`; data is protected only inside server actions, so non‑admins see empty/failed states.
- **Impact**: Confusing UX and possible information leakage (e.g. layout or URLs).
- **Fix**: Add a Next.js **proxy** (file `proxy.ts` at project root; Next.js has renamed the old “middleware” convention to “proxy”). Use it as a last resort when layout-based or server-action auth is not enough. The proxy should:
  - Redirect unauthenticated users from `/dashboard/*` and `/admin/*` to sign‑in.
  - Redirect non‑ADMIN users from `/admin/*` to `/` or `/dashboard`.
  - Allow `/api/auth/*` and static assets.
- **Note**: Export the function as `proxy()` (not `middleware()`). To migrate from an existing `middleware.ts`, run: `npx @next/codemod@canary middleware-to-proxy .`

### 3. **Environment and deployment**
- **Issue**: No `.env.example`; production URL and secrets not documented.
- **Impact**: Client or host may misconfigure env and break auth, DB, or uploads.
- **Fix**:
  - Add `.env.example` with all required variables (no real values):  
    `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `MINIO_*`, etc.
  - Set `NEXT_PUBLIC_APP_URL` (and auth `trustedOrigins`) to the real production URL (e.g. `https://maneelclub.com`).

---

## 🟠 Important (Strongly Recommended)

### 4. **Customer dashboard – recent orders**
- **Issue**: `src/app/(dashboard)/dashboard/page.tsx` always shows “No orders yet” and does not fetch the logged‑in user’s recent orders.
- **Fix**: In the dashboard page (or a small server component), call an action that returns the current user’s last 3–5 orders and render them in the “Recent Orders” card, with a “View all” link to `/dashboard/orders`.

### 5. **Admin “View Orders” by customer**
- **Issue**: Admin customers page links to `/admin/orders?customer=<id>` but the admin orders page does not read `customer` or filter by it.
- **Fix**: In the orders list page, read `searchParams.customer` and pass it to `getAdminOrders({ userId: customerId })` (and add that filter in the action) so “View Orders” shows that customer’s orders.

### 6. **Global error and not-found handling**
- **Issue**: No `app/error.tsx` or `app/not-found.tsx`.
- **Impact**: Unhandled errors or 404s show the default Next.js or browser UI.
- **Fix**: Add `error.tsx` (with a simple “Something went wrong” and retry/home) and `not-found.tsx` (branded 404 + link to home/shop). Optionally add `loading.tsx` for key routes.

### 7. **Outdated comment in product-category**
- **Issue**: `src/app/(shop)/product-category/[slug]/page.tsx` still says “Get category info from mock data” but uses `getCategories()` from the DB.
- **Fix**: Update the comment to “Get category info from database” (or remove it).

### 8. **Clean up unused mock data**
- **Issue**: `src/data/mock-products.ts` exists and is not imported anywhere. It’s dead code.
- **Fix**: Delete `src/data/mock-products.ts` to avoid confusion, or move it to a `/dev` or `/scripts` folder and document it as dev-only.

### 9. **Allow guest purchase (guest checkout)**
- **Issue**: Checkout currently requires a logged-in user (or may assume one). Many customers prefer to buy without creating an account.
- **Impact**: Lost sales from users who abandon at sign-in or sign-up.
- **Fix**: Support guest checkout end-to-end:
  - Allow access to `/checkout` without authentication.
  - In `createOrder`, accept orders with `userId: null` when the customer is a guest; store only the collected contact/shipping details (customer name, email, phone, address) on the order.
  - Order confirmation and any “track order” flow for guests can use order number + email or phone (e.g. simple lookup by order number and last 4 digits of phone).
  - Optionally show a one-time “Create account to track this order” prompt on the confirmation page for guests.
- **Note**: Dashboard “My Orders” and “Addresses” remain for logged-in users only; guest orders do not appear there unless the user later creates an account and you link orders (e.g. by email).

---

## 🟡 Nice to Have (Polish)

### 10. **SEO and metadata**
- **Done**: Root layout has metadata; category page has `generateMetadata`.
- **Optional**: Add `generateMetadata` for product pages (title + description from product), and for `/shop` and `/cart` if you want full control.

### 11. **Security and robustness**
- **Upload API**: Already checks admin role and file type/size; consider adding a short comment in code that only admins can upload.
- **Rate limiting**: No rate limiting on checkout or auth. For high traffic, consider adding rate limits (e.g. Upstash or similar) on `/api/auth/*` and checkout action.
- **HTTPS**: Ensure production is served over HTTPS and `NEXT_PUBLIC_APP_URL` uses `https://`.

### 12. **Handover documentation**
- **README**: Update or add a short README with: how to run locally (`pnpm install`, `pnpm dev`), required env vars (point to `.env.example`), how to run migrations and seed, and how to build/start for production.
- **Deploy**: One‑paragraph note on recommended hosting (e.g. Vercel + Postgres + MinIO or equivalent) and what env to set in the dashboard.

### 13. **Small UX improvements**
- **Empty states**: Ensure all list pages (admin products/orders/customers, shop category when no products) have clear empty states and one primary action (e.g. “Add product”, “Go to shop”).
- **Success feedback**: Checkout and order confirmation already give clear feedback; ensure profile/address save and admin actions keep using toasts or inline success messages.

### 14. **Meta Pixel / Conversion API**
- **Done**: Data layer events and server-side Conversions API Purchase are implemented.
- **Env (server)**: `META_PIXEL_ID` (Pixel ID), `META_CAPI_ACCESS_TOKEN` (Conversions API access token). Optional: `NEXT_PUBLIC_APP_URL` for `event_source_url`. If env is unset, server Purchase is skipped.
- **Client**: Install the Meta Pixel base snippet (root layout or GTM). Configure the pixel to read events from `dataLayer` and, for Purchase, send **eventID** equal to `event_id` (order number) so Meta deduplicates with the server Purchase event.

---

## Summary Checklist Before Handover

| Item | Priority | Status |
|------|----------|--------|
| Fix Address `createdAt` (schema + migration) | Critical | ⬜ |
| Proxy for `/admin` and `/dashboard` (route protection) | Critical | ⬜ |
| `.env.example` + production URL in env | Critical | ⬜ |
| Dashboard recent orders (real data) | Important | ⬜ |
| Admin orders filter by customer | Important | ⬜ |
| `error.tsx` + `not-found.tsx` | Important | ⬜ |
| Fix product-category comment | Important | ⬜ |
| Remove or relocate mock-products | Important | ⬜ |
| Allow guest purchase (guest checkout) | Important | ⬜ |
| Data layer for Meta Pixel (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase + event_id) | Done | ✅ |
| Conversions API server Purchase (createOrder) + env META_PIXEL_ID, META_CAPI_ACCESS_TOKEN | Done | ✅ |
| Install Meta Pixel base code and pass eventID for Purchase | Nice to have | ⬜ |
| README / deploy notes | Nice to have | ⬜ |

Once the critical and important items are done, the project is in good shape for production handover. The nice‑to‑have items can be done before or shortly after launch depending on time.
