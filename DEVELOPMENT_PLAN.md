# Maneel Club E-commerce - Development Plan

## Project Overview

| Field | Value |
|-------|-------|
| Brand | Maneel Club |
| Current Site | https://maneelclub.com/ |
| Primary Color | #23020e |
| Currency | BDT |
| Country | Bangladesh |
| WhatsApp | +8801997193518 |
| Target | 90% mobile users |

---

## Current Status Summary

### What's Built (UI Complete)
- ✅ All pages created (Homepage, Shop, Product, Cart, Checkout, Dashboard, Admin)
- ✅ Authentication system (Better Auth)
- ✅ Cart functionality (Zustand + localStorage)
- ✅ Route protection (proxy.ts)
- ✅ Admin CRUD pages exist
- ✅ shadcn/ui components configured
- ✅ Database schema created
- ✅ Migrations applied

### Critical Issues Found
1. **Schema Mismatch** - Database has `price`/`discountPrice`/`featured` but code uses `regularPrice`/`salePrice`/`isFeatured`
2. **Missing Fields** - Database Product model lacks `colors`, `sizes`, `stock` fields (only on variants)
3. **Seed Will Fail** - Seed script uses wrong field names
4. **Empty Database** - No products or categories exist yet
5. **No Admin User** - Cannot access admin panel

---

## Development Phases

### Phase 1: Fix Critical Database Issues 🔴 CRITICAL
**Estimated Tasks: 4 | Status: Pending**

#### Task 1.1: Update Prisma Schema
Update `prisma/schema.prisma` to add missing fields:
- [ ] Add `regularPrice` field (rename from `price`)
- [ ] Add `salePrice` field (rename from `discountPrice`)
- [ ] Add `isFeatured` field (rename from `featured`)
- [ ] Add `colors` String[] field
- [ ] Add `sizes` String[] field
- [ ] Add `stock` Int field

#### Task 1.2: Create New Migration
- [ ] Run `npx prisma migrate dev --name fix_product_fields`
- [ ] Verify migration successful

#### Task 1.3: Regenerate Prisma Client
- [ ] Run `npx prisma generate`

#### Task 1.4: Update Types
- [ ] Update `src/types/index.ts` to match new schema

---

### Phase 2: Seed Database 🔴 CRITICAL
**Estimated Tasks: 4 | Status: Pending**

#### Task 2.1: Verify Seed Script
- [ ] Ensure seed.ts uses correct field names
- [ ] Test seed script locally

#### Task 2.2: Run Database Seed
- [ ] Run `pnpm db:seed`
- [ ] Verify categories created (4 categories)
- [ ] Verify products created (8 products)

#### Task 2.3: Create Admin User
- [ ] Sign up at `/sign-up` with your email
- [ ] Run SQL: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com'`
- [ ] Verify admin access at `/admin`

#### Task 2.4: Test Basic Flow
- [ ] Homepage shows products
- [ ] Product detail page works
- [ ] Add to cart works
- [ ] Admin products page shows data

---

### Phase 3: Fix Admin Product CRUD 🟡 HIGH
**Estimated Tasks: 5 | Status: Pending**

#### Task 3.1: Fix Product List Page
- [ ] Update admin products page to handle Prisma Decimal
- [ ] Fix type errors

#### Task 3.2: Fix Create Product Action
- [ ] Update `createProduct` in `src/actions/admin/products.ts`
- [ ] Map input fields to database fields correctly
- [ ] Test creating a product

#### Task 3.3: Fix Edit Product Page
- [ ] Update `src/app/(admin)/admin/products/[id]/page.tsx`
- [ ] Map database fields to form fields
- [ ] Test editing a product

#### Task 3.4: Fix Delete Product
- [ ] Test delete functionality
- [ ] Verify cascade delete of variants

#### Task 3.5: Add Category CRUD
- [ ] Create admin categories page
- [ ] Add/Edit/Delete categories

---

### Phase 4: Fix Public Product Display 🟡 HIGH
**Estimated Tasks: 4 | Status: Pending**

#### Task 4.1: Fix transformProduct Function
- [ ] Update `src/actions/products.ts`
- [ ] Map `regularPrice` from DB `price` if needed
- [ ] Handle Decimal to number conversion

#### Task 4.2: Fix Product Card
- [ ] Ensure ProductCard handles all price formats
- [ ] Test discount percentage calculation

#### Task 4.3: Fix Product Detail Page
- [ ] Verify color/size selectors work
- [ ] Test variant selection

#### Task 4.4: Fix Shop Filters
- [ ] Verify filter by color works
- [ ] Verify filter by size works
- [ ] Verify price filter works

---

### Phase 5: Fix Order System 🟡 HIGH
**Estimated Tasks: 4 | Status: Pending**

#### Task 5.1: Test Checkout Flow
- [ ] Add items to cart
- [ ] Go through checkout
- [ ] Verify order saves to database

#### Task 5.2: Fix Order Status Update
- [ ] Test status change in admin
- [ ] Verify revalidation works

#### Task 5.3: User Order History
- [ ] Verify user can see their orders
- [ ] Test order detail view

#### Task 5.4: Admin Order Management
- [ ] Test order list with filters
- [ ] Test order detail view
- [ ] Test status updates

---

### Phase 6: User Dashboard Completion 🟢 MEDIUM
**Estimated Tasks: 4 | Status: Pending**

#### Task 6.1: Profile Update
- [ ] Test profile form saves to database
- [ ] Add success/error toasts

#### Task 6.2: Password Change
- [ ] Implement password change with Better Auth
- [ ] Add validation

#### Task 6.3: Address Management
- [ ] Create address CRUD actions
- [ ] Add address form
- [ ] Set default address

#### Task 6.4: Order Tracking
- [ ] Show order timeline/status
- [ ] WhatsApp contact for support

---

### Phase 7: Admin Dashboard Completion 🟢 MEDIUM
**Estimated Tasks: 5 | Status: Pending**

#### Task 7.1: Dashboard Stats
- [ ] Fix revenue calculation
- [ ] Add date range filter
- [ ] Show growth percentages

#### Task 7.2: Low Stock Alerts
- [ ] Show products with low stock
- [ ] Quick restock action

#### Task 7.3: Customer Management
- [ ] View customer details
- [ ] View customer order history
- [ ] Customer contact info

#### Task 7.4: Settings Page
- [ ] Store information settings
- [ ] Shipping rates configuration
- [ ] Save to database or config

#### Task 7.5: Analytics Page
- [ ] Sales chart
- [ ] Order trends
- [ ] Top products

---

### Phase 8: Image Upload System 🟢 MEDIUM
**Estimated Tasks: 4 | Status: Pending**

#### Task 8.1: Choose Provider
Options:
- Cloudinary (recommended for free tier)
- Vercel Blob
- AWS S3

#### Task 8.2: Setup Provider
- [ ] Create account
- [ ] Get API keys
- [ ] Add to .env

#### Task 8.3: Create Upload Component
- [ ] Image preview
- [ ] Drag and drop
- [ ] Multiple images

#### Task 8.4: Integrate with Product Form
- [ ] Replace URL input with uploader
- [ ] Store URLs in database

---

### Phase 9: Data Migration from Old Site 🟢 MEDIUM
**Estimated Tasks: 4 | Status: Pending**

#### Task 9.1: Export Old Data
- [ ] Export products from WooCommerce/WordPress
- [ ] Export categories
- [ ] Download product images

#### Task 9.2: Create Migration Script
- [ ] Parse exported data
- [ ] Map to new schema
- [ ] Handle variants

#### Task 9.3: Import Products
- [ ] Run migration script
- [ ] Verify all products imported
- [ ] Check images

#### Task 9.4: URL Redirects
- [ ] Map old URLs to new URLs
- [ ] Create redirect rules
- [ ] Test SEO preservation

---

### Phase 10: Email Notifications 🔵 LOW
**Estimated Tasks: 4 | Status: Pending**

#### Task 10.1: Setup Resend
- [ ] Create Resend account
- [ ] Get API key
- [ ] Install package

#### Task 10.2: Create Email Templates
- [ ] Order confirmation
- [ ] Order shipped
- [ ] Welcome email

#### Task 10.3: Trigger Emails
- [ ] Send on order create
- [ ] Send on status change

#### Task 10.4: Test Emails
- [ ] Test all templates
- [ ] Check mobile rendering

---

### Phase 11: SEO & Analytics 🔵 LOW
**Estimated Tasks: 4 | Status: Pending**

#### Task 11.1: Meta Tags
- [ ] Dynamic page titles
- [ ] Meta descriptions
- [ ] OpenGraph images

#### Task 11.2: Structured Data
- [ ] Product JSON-LD
- [ ] Organization schema
- [ ] Breadcrumb schema

#### Task 11.3: Sitemap & Robots
- [ ] Generate sitemap.xml
- [ ] Create robots.txt

#### Task 11.4: Analytics
- [ ] Setup Google Analytics 4
- [ ] Setup Facebook Pixel
- [ ] Track conversions

---

### Phase 12: Testing & QA 🔵 LOW
**Estimated Tasks: 4 | Status: Pending**

#### Task 12.1: Mobile Testing
- [ ] Test on Android
- [ ] Test on iOS
- [ ] Fix responsive issues

#### Task 12.2: Browser Testing
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

#### Task 12.3: Flow Testing
- [ ] Complete purchase flow
- [ ] Auth flows
- [ ] Admin operations

#### Task 12.4: Performance
- [ ] Lighthouse audit
- [ ] Fix Core Web Vitals
- [ ] Image optimization

---

### Phase 13: Deployment 🔵 LOW
**Estimated Tasks: 5 | Status: Pending**

#### Task 13.1: Production Database
- [ ] Setup Neon/Supabase/Vercel Postgres
- [ ] Run migrations
- [ ] Seed initial data

#### Task 13.2: Vercel Deployment
- [ ] Connect GitHub repo
- [ ] Configure environment variables
- [ ] Deploy

#### Task 13.3: Domain Setup
- [ ] Configure maneelclub.com
- [ ] Setup SSL
- [ ] Configure redirects

#### Task 13.4: Go Live
- [ ] Final testing
- [ ] Switch DNS
- [ ] Monitor errors

#### Task 13.5: Post-Launch
- [ ] Monitor performance
- [ ] Check error logs
- [ ] Customer feedback

---

## Immediate Action Items

### Start Now - Phase 1, Task 1.1

Update `prisma/schema.prisma` Product model:

```prisma
model Product {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  description   String?  @db.Text
  regularPrice  Decimal  @db.Decimal(10, 2)  // renamed from price
  salePrice     Decimal? @db.Decimal(10, 2)  // renamed from discountPrice
  images        String[]
  colors        String[]                      // NEW
  sizes         String[]                      // NEW
  stock         Int      @default(0)          // NEW
  isFeatured    Boolean  @default(false)      // renamed from featured
  isActive      Boolean  @default(true)
  sizeChart     Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
  variants   ProductVariant[]
  orderItems OrderItem[]

  @@index([categoryId])
  @@index([slug])
  @@index([isFeatured])
  @@index([isActive])
}
```

---

## Quick Commands

```bash
# Development
pnpm dev                    # Start dev server

# Database
pnpm db:push               # Push schema (no migration)
pnpm db:migrate            # Run migrations
pnpm db:seed               # Seed data
pnpm db:studio             # Open Prisma Studio

# Build
pnpm build                 # Production build
pnpm start                 # Start production
```

---

## File Structure Summary

```
src/
├── app/
│   ├── (admin)/admin/     # Admin pages ✅
│   ├── (auth)/            # Sign in/up ✅
│   ├── (dashboard)/       # User dashboard ✅
│   ├── (shop)/            # Store pages ✅
│   └── api/auth/          # Auth API ✅
├── actions/
│   ├── admin/             # Admin actions ⚠️ needs fixes
│   ├── orders.ts          # Order actions ✅
│   └── products.ts        # Product actions ⚠️ needs fixes
├── components/
│   ├── layout/            # Header, Footer ✅
│   ├── product/           # Product components ✅
│   ├── skeletons/         # Loading states ✅
│   └── ui/                # shadcn ✅
├── lib/                   # Utilities ✅
├── schemas/               # Zod schemas ✅
├── store/                 # Zustand ✅
├── types/                 # TypeScript ⚠️ needs update
└── proxy.ts               # Route protection ✅
```

---

## Priority Order

| Priority | Phase | Description |
|----------|-------|-------------|
| 🔴 P0 | Phase 1 | Fix Database Schema |
| 🔴 P0 | Phase 2 | Seed Database |
| 🟡 P1 | Phase 3 | Fix Admin CRUD |
| 🟡 P1 | Phase 4 | Fix Product Display |
| 🟡 P1 | Phase 5 | Fix Order System |
| 🟢 P2 | Phase 6 | User Dashboard |
| 🟢 P2 | Phase 7 | Admin Dashboard |
| 🟢 P2 | Phase 8 | Image Upload |
| 🟢 P2 | Phase 9 | Data Migration |
| 🔵 P3 | Phase 10 | Email Notifications |
| 🔵 P3 | Phase 11 | SEO & Analytics |
| 🔵 P3 | Phase 12 | Testing & QA |
| 🔵 P3 | Phase 13 | Deployment |

---

*Last Updated: February 4, 2026*

**Ready to start?** Say "start phase 1" and I'll begin fixing the database schema.
