# Reviews and social proof: admin-managed

## Goal

The static social-proof UI (home page section, `/reviews` page, product Reviews tab, trust line) is
finalised. Make every part of it manageable from the admin panel: upload and organise customer
screenshots, choose which are featured, tag them to products, edit the customer-count wording,
and switch each placement on or off. No code change should be needed after launch.

## Constraints

- `.env.local` points at the **live production database**. No migration, `db push` or seed is run
  against it during development. The migration and seed are written and checked offline, then
  applied once, with the owner's approval, as a deploy step.
- The change is additive: one enum, two new tables, new setting keys. Nothing existing is altered.
- Storefront reads must not crash if the table is missing (deploy before migration): they log and
  return an empty list, and every placement already hides itself when empty.

## Data model (Prisma)

```prisma
enum ReviewSource { MESSENGER INSTAGRAM FACEBOOK WHATSAPP PHOTO OTHER }

model Review {
  id           String       @id @default(cuid())
  image        String       // ImageKit URL (or /reviews/... for the seeded originals)
  width        Int          // natural pixel size, read in the browser before upload
  height       Int
  caption      String       @default("") // not shown; used as alt text for accessibility + SEO
  customerName String       @default("")
  source       ReviewSource @default(MESSENGER)
  isFeatured   Boolean      @default(false) // home page + product-tab fallback
  isActive     Boolean      @default(true)
  sortOrder    Int          @default(0)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  products     ReviewProduct[]
  @@index([isActive, sortOrder])
}

model ReviewProduct {            // screenshots tagged to specific products
  reviewId  String
  productId String
  review    Review  @relation(fields: [reviewId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@id([reviewId, productId])
  @@index([productId])
}
```

## Settings (existing key/value table, new keys in `DEFAULT_SETTINGS`)

| Key | Default | Drives |
|---|---|---|
| `reviewsCustomerCount` | `10,000+` | home heading, trust line, `/reviews` intro |
| `reviewsOrdersDelivered` | `8,800+` | home section sub-line |
| `reviewsHomeEnabled` | `true` | home section on/off |
| `reviewsProductTabEnabled` | `true` | product Reviews tab on/off |
| `reviewsTrustLineEnabled` | `true` | trust line under Buy Now on/off |

## Code layout

- `src/lib/reviews-shared.ts` (client-safe, pure, unit tested): `Review` type, `SOURCE_META`,
  `reviewAltText`, `pickReviewsForProduct(all, productId, limit)` (tagged first, then featured),
  `buildSocialProofSettings(settings)`.
- `src/lib/reviews.ts` (server): React-`cache`d `getActiveReviews`, `getReviewsForProduct`,
  `getSocialProofSettings`; each catches errors and returns empty/defaults.
- `src/actions/admin/reviews.ts` (admin-checked, zod-validated): `getAdminReviews`, `createReviews`
  (batch, appended to the end), `updateReview`, `deleteReview`, `reorderReviews`; every write calls
  `revalidatePath("/", "layout")` so the home, `/reviews` and product pages refresh.
- `src/app/(admin)/admin/reviews/page.tsx`: the admin screen (below) and a sidebar link.
- Storefront components receive data as props; `src/lib/reviews-static.ts` is deleted.

## Admin screen: Admin → Reviews

1. **Display settings card**: customer count, orders delivered, three on/off switches. Saves only
   these keys through the existing `updateSettings` action.
2. **Upload**: pick many screenshots at once. Each is measured in the browser, uploaded through the
   existing `/api/upload` (ImageKit), and saved as an active, non-featured review at the end of the
   list. Progress shows "Uploading 3 of 20". Failures are listed; successes are kept.
3. **Screenshot grid** in display order, each tile showing the image in the storefront 9:16 frame
   with: Active switch, Featured star, move earlier/later, Edit, Delete.
4. **Edit dialog**: customer name, source, caption (explained as "not shown; describes the image
   for screen readers and Google"), tagged products (search by name, reusing
   `getAdminProductsSearch`).
5. **Delete** asks for confirmation. The ImageKit file is kept (other content may use it).
6. A privacy reminder above the upload button: blur names and phone numbers first.

## Storefront wiring

- Home: `SocialProofSection` becomes async, reads settings + reviews, hides if disabled or empty.
- `/reviews`: reads all active reviews, intro uses the customer count.
- Product page (`page.tsx`, server): fetches `getReviewsForProduct(product.id, 10)` and social-proof
  settings, passes them to `ProductDetails`, which passes reviews to `ProductTabs` and the count to
  `TrustLine`, each respecting its on/off switch.

## Launch steps (need owner approval, run once)

Order matters: the home page and `/reviews` are prerendered at build time, so the table must
exist and hold the screenshots **before** `next build`, or those pages ship empty until the next
admin save.

1. Pull the code on the server.
2. `npx prisma migrate deploy` applies `prisma/migrations/20260924000000_add_reviews`.
3. `npx tsx prisma/seed-reviews.ts` prints the target database and what it would insert; then
   `npx tsx prisma/seed-reviews.ts --yes` inserts the 14 existing screenshots (skips if the table
   already has rows). Never run `pnpm db:seed` here: it resets every setting to defaults.
4. `next build` and restart. After that everything is managed in Admin → Reviews.

If the build ever runs first, saving anything in Admin → Reviews refreshes the pages.

## Verification

- Unit tests for the pure helpers (`node --import tsx --test`).
- Migration SQL generated offline with `prisma migrate diff --from-schema <old> --to-schema <new>`.
- ESLint on changed files, `tsc --noEmit`, `next build`.
- Admin screen rendered and driven in the browser only up to the point of writing; no writes to the
  live database. Full end-to-end (upload, reorder, feature, tag) is checked after the migration.
