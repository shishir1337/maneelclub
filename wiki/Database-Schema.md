# Database Schema

Complete documentation of the Maneel Club database schema.

## 📊 Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │────────▶│    Order     │────────▶│  OrderItem  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Address    │         │   Payment    │         │   Product   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         │
                        ┌────────────────────────────────┼──────────────┐
                        │                                │              │
                        ▼                                ▼              ▼
                 ┌──────────────┐              ┌──────────────┐ ┌──────────────┐
                 │   Category   │              │  Attribute  │ │   Variant    │
                 └──────────────┘              └──────────────┘ └──────────────┘
```

## 📋 Core Models

### User

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(CUSTOMER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  addresses     Address[]
  orders        Order[]
  sessions      Session[]
  accounts      Account[]
}
```

**Fields:**
- `id`: Unique identifier (CUID)
- `email`: User email (unique)
- `role`: User role (CUSTOMER or ADMIN)
- `name`: User's display name

**Relationships:**
- Has many Addresses
- Has many Orders
- Has many Sessions (Better Auth)
- Has many Accounts (Better Auth)

---

### Product

```prisma
model Product {
  id             String      @id @default(cuid())
  title          String
  slug           String      @unique
  description    String?     @db.Text
  regularPrice   Decimal     @db.Decimal(10, 2)
  salePrice      Decimal?    @db.Decimal(10, 2)
  images         String[]
  colors         String[]    @default([])
  sizes          String[]    @default([])
  stock          Int         @default(0)
  productType    ProductType @default(SIMPLE)
  trackInventory Boolean     @default(false)
  isFeatured     Boolean     @default(false)
  isActive       Boolean     @default(true)
  sizeChart      Json?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  categoryId     String?
  category       Category?   @relation("ProductCategoryLegacy")
  categories     ProductCategory[]
  attributes     ProductAttribute[]
  variants       ProductVariant[]
  orderItems     OrderItem[]
}
```

**Fields:**
- `slug`: URL-friendly identifier (unique)
- `productType`: SIMPLE or VARIABLE
- `regularPrice`: Base price
- `salePrice`: Discounted price (optional)
- `images`: Array of image URLs
- `isFeatured`: Featured product flag
- `isActive`: Product visibility flag

**Indexes:**
- `categoryId`
- `slug`
- `isFeatured`
- `isActive`

---

### ProductVariant

```prisma
model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  sku       String?  @unique
  price     Decimal? @db.Decimal(10, 2)
  stock     Int      @default(0)
  image     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  product           Product                @relation(fields: [productId], references: [id], onDelete: Cascade)
  attributeValues   ProductVariantAttributeValue[]
  orderItems        OrderItem[]
}
```

**Purpose:** Stores variant-specific data (size, color combinations) for variable products.

---

### Category

```prisma
model Category {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?  @db.Text
  image       String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  products    Product[] @relation("ProductCategoryLegacy")
  productCategories ProductCategory[]
}
```

**Relationships:**
- Many-to-many with Products (via ProductCategory)

---

### Order

```prisma
model Order {
  id            String        @id @default(cuid())
  orderNumber   String        @unique
  userId        String
  status        OrderStatus   @default(PENDING)
  paymentMethod PaymentMethod
  paymentStatus PaymentStatus @default(PENDING)
  subtotal      Decimal       @db.Decimal(10, 2)
  shipping      Decimal       @db.Decimal(10, 2)
  total         Decimal       @db.Decimal(10, 2)
  shippingZone  ShippingZone
  city          String
  address       String        @db.Text
  phone         String
  notes         String?       @db.Text
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  user      User        @relation(fields: [userId], references: [id])
  items     OrderItem[]
  payment   Payment?
}
```

**Status Flow:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                                    ↓
                                CANCELLED
```

---

### OrderItem

```prisma
model OrderItem {
  id        String   @id @default(cuid())
  orderId   String
  productId String
  variantId String?
  quantity  Int
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id])
}
```

---

### Attribute & ProductAttribute

```prisma
model Attribute {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  values    AttributeValue[]
  products  ProductAttribute[]
}

model ProductAttribute {
  id          String @id @default(cuid())
  productId   String
  attributeId String
  
  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute Attribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  selectedValues ProductAttributeValue[]
  
  @@unique([productId, attributeId])
}
```

**Purpose:** Flexible attribute system (e.g., Size, Color) with custom values per product.

---

### HeroSlide

```prisma
model HeroSlide {
  id        String   @id @default(cuid())
  image     String
  alt       String   @default("")
  link      String?
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([isActive, sortOrder])
}
```

**Purpose:** Homepage carousel slides.

---

### City

```prisma
model City {
  id           String       @id @default(cuid())
  name         String
  value        String       @unique
  shippingZone ShippingZone
  sortOrder    Int          @default(0)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  
  @@index([shippingZone])
}
```

**Shipping Zones:**
- `inside_dhaka`: Lower shipping rate
- `outside_dhaka`: Higher shipping rate

---

### Setting

```prisma
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([key])
}
```

**Purpose:** Key-value store for site-wide settings.

**Common Settings:**
- `storeName`
- `storeEmail`
- `shippingDhaka`
- `shippingOutside`
- `freeShippingMinimum`
- `metaPixelId`
- `gtmContainerId`

---

## 🔑 Enums

### Role

```prisma
enum Role {
  CUSTOMER
  ADMIN
}
```

### OrderStatus

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### PaymentMethod

```prisma
enum PaymentMethod {
  COD
  BKASH
  NAGAD
  ROCKET
}
```

### PaymentStatus

```prisma
enum PaymentStatus {
  PENDING
  PAID
  FAILED
}
```

### ShippingZone

```prisma
enum ShippingZone {
  inside_dhaka
  outside_dhaka
}
```

### ProductType

```prisma
enum ProductType {
  SIMPLE
  VARIABLE
}
```

---

## 🔍 Indexes

### Performance Indexes

- `User.email` (unique)
- `Product.slug` (unique)
- `Product.categoryId`
- `Product.isFeatured`
- `Product.isActive`
- `Order.orderNumber` (unique)
- `Order.userId`
- `OrderItem.orderId`
- `City.shippingZone`
- `HeroSlide.isActive, sortOrder`

---

## 🔄 Migrations

### Running Migrations

```bash
# Create new migration
pnpm db:migrate

# Apply migrations
pnpm db:push

# Reset database (⚠️ Destructive)
pnpm db:reset
```

### Migration History

- `20260207120000_baseline` - Initial schema
- `20260207121934_add_hero_slides` - Hero slides feature
- `20260207150000_add_delivery_areas` - Cities and shipping zones
- `20260208091717_add_rate_limit_table` - Rate limiting
- `20260209101850_add_product_categories_many_to_many` - Many-to-many categories

---

## 📊 Database Queries

### Common Queries

**Get featured products:**
```typescript
const products = await prisma.product.findMany({
  where: { isFeatured: true, isActive: true },
  include: { category: true },
  orderBy: { createdAt: 'desc' },
})
```

**Get user orders:**
```typescript
const orders = await prisma.order.findMany({
  where: { userId },
  include: { items: { include: { product: true } } },
  orderBy: { createdAt: 'desc' },
})
```

**Get products by category:**
```typescript
const products = await prisma.product.findMany({
  where: {
    categories: {
      some: { category: { slug: categorySlug } }
    },
    isActive: true,
  },
})
```

---

## 📚 Related Documentation

- [Architecture](Architecture)
- [API Reference](API-Reference)
- [Installation](Installation)

---

*Last updated: February 2026*
