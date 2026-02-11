# API Reference

Complete API documentation for Maneel Club.

## 📡 API Routes

### Authentication API

#### POST `/api/auth/sign-up`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

#### POST `/api/auth/sign-in`

Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "clxxx...",
    "email": "user@example.com"
  },
  "session": {
    "id": "session_xxx"
  }
}
```

---

### Upload API

#### POST `/api/upload`

Upload a file (image or other).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` (File)

**Response:**
```json
{
  "url": "https://ik.imagekit.io/xxx/image.jpg",
  "key": "image.jpg"
}
```

**Storage Priority:**
1. ImageKit (if configured)
2. MinIO (if configured)
3. Local filesystem

---

### Media Library API

#### GET `/api/media-library`

List files from ImageKit media library.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search query
- `folder` (optional): Folder path

**Response:**
```json
{
  "files": [
    {
      "id": "file_id",
      "name": "image.jpg",
      "url": "https://ik.imagekit.io/xxx/image.jpg",
      "thumbnailUrl": "https://ik.imagekit.io/xxx/image.jpg?tr=w-200",
      "size": 123456,
      "createdAt": "2026-02-11T00:00:00Z"
    }
  ],
  "hasMore": true
}
```

---

### Uploads API

#### GET `/api/uploads/[...path]`

Serve uploaded files from local storage.

**Path Parameters:**
- `path`: File path relative to `public/uploads/`

**Response:**
- File content with appropriate Content-Type

---

## 🔧 Server Actions

### Product Actions

#### `createProduct(data: ProductInput)`

Create a new product.

**Location:** `src/actions/admin/products.ts`

**Parameters:**
```typescript
interface ProductInput {
  title: string
  slug: string
  description?: string
  regularPrice: number
  salePrice?: number
  images: string[]
  categoryId?: string
  productType: 'SIMPLE' | 'VARIABLE'
  isFeatured?: boolean
  isActive?: boolean
}
```

**Returns:**
```typescript
Promise<Product>
```

---

#### `updateProduct(id: string, data: Partial<ProductInput>)`

Update an existing product.

**Location:** `src/actions/admin/products.ts`

**Parameters:**
- `id`: Product ID
- `data`: Partial product data

**Returns:**
```typescript
Promise<Product>
```

---

#### `deleteProduct(id: string)`

Delete a product.

**Location:** `src/actions/admin/products.ts`

**Returns:**
```typescript
Promise<void>
```

---

### Order Actions

#### `createOrder(data: OrderInput)`

Create a new order.

**Location:** `src/actions/orders.ts`

**Parameters:**
```typescript
interface OrderInput {
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    price: number
  }>
  shippingZone: 'inside_dhaka' | 'outside_dhaka'
  city: string
  address: string
  phone: string
  paymentMethod: 'COD' | 'BKASH' | 'NAGAD' | 'ROCKET'
  notes?: string
}
```

**Returns:**
```typescript
Promise<Order>
```

---

#### `updateOrderStatus(id: string, status: OrderStatus)`

Update order status.

**Location:** `src/actions/admin/orders.ts`

**Parameters:**
- `id`: Order ID
- `status`: New order status

**Returns:**
```typescript
Promise<Order>
```

---

### User Actions

#### `updateProfile(data: ProfileInput)`

Update user profile.

**Location:** `src/actions/profile.ts`

**Parameters:**
```typescript
interface ProfileInput {
  name: string
  phone?: string
}
```

**Returns:**
```typescript
Promise<User>
```

---

## 📝 Type Definitions

### Product Types

```typescript
enum ProductType {
  SIMPLE = 'SIMPLE',
  VARIABLE = 'VARIABLE'
}

interface Product {
  id: string
  title: string
  slug: string
  description?: string
  regularPrice: number
  salePrice?: number
  images: string[]
  productType: ProductType
  isFeatured: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Order Types

```typescript
enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

enum PaymentMethod {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET'
}

interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  subtotal: number
  shipping: number
  total: number
  shippingZone: 'inside_dhaka' | 'outside_dhaka'
  city: string
  address: string
  phone: string
  createdAt: Date
  items: OrderItem[]
}
```

---

## 🔐 Authentication

### Session Management

Sessions are managed by Better Auth:
- Sessions stored in database
- Cookie-based authentication
- Automatic session refresh

### Protected Routes

Use `auth()` helper to check authentication:

```typescript
import { auth } from '@/lib/auth'

export async function protectedAction() {
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')
  }
  // ... action logic
}
```

---

## 📊 Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `INTERNAL_ERROR` - Server error

---

## 🚀 Rate Limiting

### Authentication Endpoints

- Rate limit: 5 requests per minute per IP
- Window: 60 seconds

### Upload Endpoints

- Rate limit: 10 requests per minute per user
- File size limit: 10MB

---

## 📚 Examples

### Create Product

```typescript
import { createProduct } from '@/actions/admin/products'

const product = await createProduct({
  title: 'Premium T-Shirt',
  slug: 'premium-t-shirt',
  description: 'High quality cotton t-shirt',
  regularPrice: 1500,
  salePrice: 1200,
  images: ['https://ik.imagekit.io/xxx/image.jpg'],
  productType: 'SIMPLE',
  isFeatured: true,
  isActive: true,
})
```

### Create Order

```typescript
import { createOrder } from '@/actions/orders'

const order = await createOrder({
  items: [
    {
      productId: 'clxxx...',
      quantity: 2,
      price: 1500,
    },
  ],
  shippingZone: 'inside_dhaka',
  city: 'Dhaka',
  address: '123 Main Street',
  phone: '+8801234567890',
  paymentMethod: 'COD',
})
```

---

## 🔍 Query Examples

### Get Products

```typescript
import { prisma } from '@/lib/prisma'

const products = await prisma.product.findMany({
  where: {
    isActive: true,
    isFeatured: true,
  },
  include: {
    category: true,
    variants: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
})
```

### Get User Orders

```typescript
const orders = await prisma.order.findMany({
  where: {
    userId: session.user.id,
  },
  include: {
    items: {
      include: {
        product: true,
        variant: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
})
```

---

## 📚 Related Documentation

- [Architecture](Architecture)
- [Database Schema](Database-Schema)
- [Configuration](Configuration)

---

*Last updated: February 2026*
