# Application Audit Report

**Date:** February 2025  
**Scope:** Bugs, security, performance, and best practices across the Maneel Club e-commerce application.

---

## Executive Summary

- **Critical:** Price manipulation in checkout has been **fixed** (server-side price resolution and stock validation).
- **Security:** Admin and dashboard routes are now protected at the layout level; all admin actions already used `checkAdmin()`.
- **Remaining:** See recommendations for rate limiting, error handling, and performance improvements.

---

## 1. Security

### 1.1 ✅ FIXED: Price manipulation in checkout (Critical)

**Issue:** `createOrder` used client-supplied cart item prices and quantities to compute subtotal/total and to create order lines. Cart is stored in localStorage and can be tampered with, allowing users to pay less than the real price.

**Fix applied:**
- Added `resolveCartItems()` that, for each cart item:
  - Loads product (and variants for variable products) from the database.
  - Validates product exists and is active.
  - For variable products, matches variant by color/size and validates stock.
  - For simple products, validates product stock.
  - Computes **server-side price** (sale/regular or variant override) and never uses client `item.price`.
- Order subtotal/total and order line prices are now computed only from resolved items.
- Stock is deducted only for resolved items inside the same transaction.

**Files changed:** `src/actions/orders.ts`

### 1.2 ✅ FIXED: Route protection for /admin and /dashboard

**Issue:** There was no middleware; protection relied only on server actions (e.g. `checkAdmin()`). Unauthenticated users could open `/admin` or `/dashboard` and see the layout until a data request failed.

**Fix applied:**
- **Admin layout** (`src/app/(admin)/layout.tsx`): Async layout now calls `auth.api.getSession()`. If no session → redirect to `/sign-in?callbackUrl=/admin`. If session exists but `role !== "ADMIN"` → redirect to `/`.
- **Dashboard layout** (`src/app/(dashboard)/layout.tsx`): Async layout now checks session; if not authenticated → redirect to `/sign-in?callbackUrl=/dashboard`.

**Note:** Better Auth does not support session checks in Edge middleware (requires DB); layout-level protection is the recommended approach.

### 1.3 Already in place

- **Upload API** (`/api/upload`): Admin-only (session + role check), 5MB limit, allowed MIME types.
- **Uploads serve route** (`/api/uploads/[[...path]]`): Path traversal guarded; public GET for assets is intentional.
- **Admin actions:** All under `src/actions/admin/*` use a shared `checkAdmin()` that enforces session and `role === "ADMIN"`.
- **Order by number:** `getOrderByNumber(orderNumber)` is public by design for order confirmation (guest checkout). Consider adding optional short-lived signed tokens or captcha if order enumeration is a concern.

### 1.4 Recommendations

- **Rate limiting:** Add rate limits for sign-in, sign-up, and `createOrder` (e.g. per IP or per user) to reduce brute-force and abuse.
- **Upload file validation:** If strictness is required, validate uploaded image files with magic-byte checks on the server instead of relying only on client `file.type`.
- **Error responses:** Avoid leaking stack traces or internal paths in production; use a generic message and log details server-side.

---

## 2. Bugs

### 2.1 ✅ FIXED: Stock and price trust

- **Stock:** Orders are now validated for sufficient stock before creating the order; clear error messages (e.g. "Insufficient stock for X. Available: N") are returned. Stock deduction runs inside the same transaction as order creation.
- **Price:** No longer trusting client; see §1.1.

### 2.2 Minor / existing behavior

- **Order confirmation by number:** Anyone with an order number can view that order’s confirmation page. This is intentional for guest checkout; document or add optional token/captcha if needed.
- **`confirm()` in admin:** `admin/settings/page.tsx` uses `confirm("Are you sure...")` for reset settings; acceptable for admin-only.
- **Invoice print:** Uses `invoiceRef.current.innerHTML` for print content; ensure invoice content is not user-controlled (it comes from order data).

---

## 3. Performance

### 3.1 Current state

- **createOrder:** Resolves each cart item with a separate product (and variants) query. For large carts this is N+1; acceptable for typical cart sizes. If needed, batch by product IDs and fetch all products/variants in one or two queries, then resolve in memory.
- **Database:** Prisma with PostgreSQL; indexes exist on `slug`, `categoryId`, `isActive`, `isFeatured` for Product; Order has `orderNumber` unique. Consider indexes on `Order(userId)`, `Order(createdAt)` if order list queries are slow.
- **Caching:** Settings (e.g. shipping rates, hero, tracking) are read from DB when needed; consider short-lived cache (e.g. `unstable_cache` or in-memory) for frequently read, rarely updated settings.
- **Pagination:** Admin and shop lists use or support pagination where applicable; verify page sizes and total counts are bounded.

### 3.2 Recommendations

- Add caching for global settings (shipping, hero, tracking) with revalidation on admin update.
- If order history or admin order list grows large, ensure pagination and indexes (e.g. `userId`, `createdAt`) are in place.
- Consider image optimization (Next.js `Image` is used; ensure `remotePatterns` and sizes are configured if using external/minio URLs).

---

## 4. Best Practices

### 4.1 Done

- **Validation:** Checkout form validated with Zod (`checkoutSchema`); server actions validate input.
- **Auth:** Better Auth with session, roles, and trusted origins.
- **Secrets:** No secrets in client bundles; only `NEXT_PUBLIC_*` and non-sensitive config in frontend.
- **Errors:** `error.tsx` and `not-found.tsx` present; avoid exposing internals in production.

### 4.2 Recommendations

- **Centralized error logging:** Use a single logger and, in production, send errors to a monitoring service (e.g. Sentry).
- **Error boundaries:** Add error boundaries around critical flows (e.g. checkout, dashboard) where useful.
- **Validation:** Ensure every server action that accepts user input validates with Zod (or equivalent) and returns structured errors.
- **Env:** Keep `.env.example` up to date and document required variables (see PRODUCTION_AND_HANDOVER_CHECKLIST.md).

---

## 5. Checklist of Changes Made

| Item | Status |
|------|--------|
| Server-side price resolution in `createOrder` | ✅ Done |
| Stock validation before order creation | ✅ Done |
| Admin layout: redirect if not authenticated or not ADMIN | ✅ Done |
| Dashboard layout: redirect if not authenticated | ✅ Done |
| Route protection (no middleware; layout-based) | ✅ Done |

---

## 6. References

- **Checkout / orders:** `src/actions/orders.ts`, `src/app/(shop)/checkout/checkout-client.tsx`, `src/schemas/checkout.ts`, `src/store/cart-store.ts`
- **Auth:** `src/lib/auth.ts`, `src/lib/auth-client.ts`
- **APIs:** `src/app/api/upload/route.ts`, `src/app/api/uploads/[[...path]]/route.ts`
- **Admin:** `src/actions/admin/*` (all use `checkAdmin()`), `src/app/(admin)/layout.tsx`
- **Production checklist:** `PRODUCTION_AND_HANDOVER_CHECKLIST.md`
