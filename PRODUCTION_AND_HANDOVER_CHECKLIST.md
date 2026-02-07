# Production Quality & Client Handover Checklist

**Last reviewed:** February 2025  
**Purpose:** Everything that is done vs. left so the app is production-ready and the client can launch and operate the business.

---

## ✅ What Is Already Production-Ready

| Area | Status |
|------|--------|
| **Shop** | Homepage (hero from admin), categories, product list/detail, cart (Zustand), checkout, order confirmation |
| **Auth** | Better Auth: sign up, sign in, session, roles (CUSTOMER/ADMIN) |
| **Guest checkout** | Checkout allowed without login; orders stored with `userId: null` |
| **Payments** | COD + bKash/Nagad/Rocket; admin can verify/reject mobile payments |
| **Customer dashboard** | Profile, addresses CRUD, order history, recent orders on dashboard home |
| **Admin** | Dashboard, orders (list/detail/filter by customer, status, payment verify), products CRUD (variants, images), categories, attributes, customers, **Hero Slider**, settings, analytics, invoice print |
| **Route protection** | Proxy: `/dashboard` and `/admin` protected; non-admins redirected from `/admin` |
| **Error handling** | `error.tsx` (Try again / Home), `not-found.tsx` (branded 404) |
| **Legal & support** | Privacy, Terms, About, Returns, Contact, FAQ, Shipping info |
| **SEO** | Root metadata; `generateMetadata` on product, category, shop, key pages |
| **Loading / UX** | Route-level `loading.tsx` and skeletons across shop, admin, dashboard |
| **Tech** | Prisma + PostgreSQL, MinIO/local uploads, `.env.example` with DB, Auth, App URL, WhatsApp, MinIO, Meta CAPI |
| **Meta** | Data layer (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase); server Conversions API for Purchase |

---

## 🔴 Must Fix Before Launch (Blockers)

### 1. **Track Order link is broken**

- **Issue:** Footer has "Track Order" → `/track-order`, but that route does not exist (404).
- **Options:**
  - **A)** Add a simple **Track Order** page: user enters order number + phone (or email); show order status and details (public, no login). Best for guests and shared link.
  - **B)** Change footer "Track Order" to "My Orders" → `/dashboard/orders` (only makes sense for logged-in users; guests can’t use it).
- **Recommendation:** Add a minimal `/track-order` page (order number + phone lookup) so both guests and logged-in users can track. If you prefer not to build it now, change the footer link to `/dashboard/orders` and add a note that guests should save their order number and contact support.

---

## 🟠 Strongly Recommended (Before or Right After Launch)

### 2. **README and handover docs**

- **Issue:** README is the default Next.js one. No instructions for env, DB, or deployment.
- **Fix:** Update README to include:
  - Project name and one-line description.
  - **Run locally:** `pnpm install`, `pnpm dev`; copy `.env.example` to `.env.local` and fill required vars.
  - **Required env:** List from `.env.example` (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL, etc.).
  - **Database:** `pnpm prisma migrate deploy`, optional `pnpm run db:seed`.
  - **Production:** `pnpm build`, `pnpm start` (or Vercel/deploy commands).
  - Short **deployment note:** e.g. Vercel + Postgres (e.g. Neon/Supabase) + optional MinIO; which env to set in the host dashboard.

### 3. **Stock validation at checkout**

- **Issue:** `createOrder` deducts stock but does not check availability first. Under concurrency or race conditions, stock could go negative (oversell).
- **Fix:** Before creating the order, validate each line item (product/variant) has enough stock; if any fail, return a clear error (e.g. "Product X (Color/Size) is out of stock or quantity reduced") and do not create the order. Optionally re-fetch cart availability on the checkout page before submit.

### 4. **Production environment checklist**

- Document for the client (or in README) what to set in production:
  - `NEXT_PUBLIC_APP_URL` = live URL (e.g. `https://maneelclub.com`)
  - `BETTER_AUTH_URL` = same live URL
  - `BETTER_AUTH_SECRET` = strong secret (never commit)
  - `DATABASE_URL` = production Postgres
  - MinIO vars if using object storage for uploads; otherwise local `public/uploads` is used
  - Optional: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` for Meta ads
- Ensure production runs over **HTTPS** and that auth trusted origins include the production domain.

---

## 🟡 Nice to Have (Polish / Post-Launch)

### 5. **Rate limiting**

- No rate limiting on auth (`/api/auth/*`) or checkout. For high traffic or abuse prevention, add rate limits (e.g. per IP or per user) on sign-in, sign-up, and create-order. Can be done post-launch.

### 6. **Sitemap and robots.txt**

- No dynamic `sitemap.xml` or `robots.txt`. Adding them (e.g. Next.js app route for sitemap with products/categories, and a simple robots.txt) helps SEO. Optional before launch.

### 7. **Meta Pixel base code and eventID**

- Data layer and server CAPI are implemented. Document for the client:
  - Install the **Meta Pixel base snippet** (in layout or via GTM).
  - For **Purchase** events, send **eventID** equal to the order number so Meta can deduplicate with server-side Purchase.

### 8. **Security headers**

- next.config does not set CSP, X-Frame-Options, etc. Optional; can be added via headers in next.config or at the host (e.g. Vercel).

### 9. **Empty states and small UX**

- List pages already have empty states. Optional: double-check admin empty states and any edge cases (e.g. zero hero slides, zero products in a category).

---

## Summary: What’s Left for Production Handover

| Item | Priority | Action |
|------|----------|--------|
| Track Order page or fix footer link | **Must fix** | Add `/track-order` (order number + phone lookup) OR change link to `/dashboard/orders` and document for guests |
| README + env + deploy notes | **Strongly recommended** | Update README with run, env, DB, build, deploy |
| Stock validation before order creation | **Strongly recommended** | In `createOrder`, validate stock for each item; return clear error if insufficient |
| Production env checklist (doc) | **Strongly recommended** | Document in README or handover doc |
| Rate limiting (auth/checkout) | Nice to have | Add post-launch if needed |
| Sitemap / robots.txt | Nice to have | Add for SEO when ready |
| Meta Pixel + eventID (doc) | Nice to have | Document for client |
| Security headers | Nice to have | Optional |

---

## Conclusion

- **Core app is production-ready:** shop, checkout (including guest), auth, dashboard, admin (including hero slider), payments, legal pages, error/404, loading states, and SEO basics.
- **Before business launch:** fix the **Track Order** link (add page or change link + document), and add **README/handover docs** plus **stock validation** and a **production env checklist** so the client can run and deploy safely.
- **After launch:** rate limiting, sitemap/robots, Meta Pixel docs, and security headers can be done as needed.

Once the “Must fix” and “Strongly recommended” items are done, the application is in good shape for production handover and client-led business launch.
