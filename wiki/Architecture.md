# Architecture Overview

This document describes the architecture and design patterns used in Maneel Club.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Storefront  │  │    Admin     │  │   Dashboard │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Application                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              App Router (Next.js 16)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Pages    │  │ API Routes │  │  Server    │    │  │
│  │  │            │  │            │  │  Actions   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Server Components                  │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │ Components │  │   Hooks    │  │   Stores   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │  Products  │  │   Orders   │  │   Users    │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │  ImageKit  │  │ Better Auth│  │   Meta     │         │
│  │    CDN     │  │            │  │   Pixel    │         │
│  └────────────┘  └────────────┘  └────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
maneelclub/
├── prisma/                    # Database layer
│   ├── schema.prisma          # Prisma schema definition
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding script
│
├── public/                    # Static assets
│   ├── assets/               # Images, icons, etc.
│   └── uploads/               # Local file uploads (fallback)
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (admin)/          # Admin routes (protected)
│   │   ├── (shop)/           # Storefront routes
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # User dashboard routes
│   │   ├── api/              # API routes
│   │   └── layout.tsx         # Root layout
│   │
│   ├── actions/               # Server actions
│   │   ├── admin/            # Admin-specific actions
│   │   ├── orders.ts         # Order actions
│   │   └── profile.ts         # User profile actions
│   │
│   ├── components/            # React components
│   │   ├── admin/             # Admin components
│   │   ├── layout/           # Layout components
│   │   └── ui/               # Reusable UI components
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Better Auth configuration
│   │   ├── storage.ts        # Storage service abstraction
│   │   ├── constants.ts      # App constants
│   │   └── settings.ts       # Settings management
│   │
│   ├── schemas/               # Zod validation schemas
│   ├── store/                 # Zustand stores
│   └── types/                 # TypeScript type definitions
│
├── .env.example               # Environment variables template
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

## 🔄 Data Flow

### 1. Request Flow

```
User Action
    ↓
React Component
    ↓
Server Action / API Route
    ↓
Prisma ORM
    ↓
PostgreSQL Database
    ↓
Response
    ↓
React Component Update
```

### 2. Authentication Flow

```
Login Request
    ↓
Better Auth API
    ↓
Session Creation
    ↓
Cookie Set
    ↓
Protected Route Access
```

### 3. Image Upload Flow

```
File Upload
    ↓
Server Action
    ↓
Storage Service (ImageKit/MinIO/Local)
    ↓
URL Returned
    ↓
Database Update
```

## 🎨 Design Patterns

### Server Actions Pattern

Server actions are used for mutations and data updates:

```typescript
// src/actions/admin/products.ts
"use server"

export async function createProduct(data: ProductInput) {
  // Server-side logic
  const product = await prisma.product.create({ data })
  return product
}
```

### Component Composition

Components are composed using Radix UI primitives:

```typescript
// Reusable UI components
<Button variant="default" size="lg">
  Click me
</Button>
```

### State Management

- **Server State**: Prisma queries and server actions
- **Client State**: Zustand stores for cart and UI state
- **Form State**: React Hook Form for form management

## 🔐 Security Architecture

### Authentication

- Better Auth handles authentication
- Session-based authentication
- Rate limiting on auth endpoints
- Password hashing with bcrypt

### Authorization

- Role-based access control (ADMIN, CUSTOMER)
- Protected routes with middleware
- Server-side permission checks

### Data Validation

- Zod schemas for input validation
- Type-safe database queries with Prisma
- SQL injection prevention via Prisma

## 📦 Storage Architecture

### Multi-Storage Support

The platform supports multiple storage backends with automatic fallback:

1. **ImageKit** (Primary)
   - CDN with automatic optimization
   - URL transformations
   - Pre-compression on upload

2. **MinIO** (Fallback)
   - S3-compatible storage
   - Self-hosted option

3. **Local Filesystem** (Fallback)
   - `public/uploads/` directory
   - Development and testing

### Storage Service Abstraction

```typescript
// src/lib/storage.ts
interface StorageService {
  upload(file: Buffer, key: string, contentType: string): Promise<string>
  getPublicUrl(key: string): string
}
```

## 🚀 Performance Optimizations

### Server-Side Rendering

- React Server Components for initial render
- Reduced client-side JavaScript
- Faster Time to First Byte (TTFB)

### Image Optimization

- ImageKit CDN for automatic optimization
- Next.js Image component for lazy loading
- Responsive image sizes

### Code Splitting

- Automatic code splitting by Next.js
- Route-based code splitting
- Dynamic imports for heavy components

### Caching Strategy

- Static page generation where possible
- Database query optimization
- CDN caching for static assets

## 🔄 State Management

### Server State

- Prisma queries for data fetching
- Server actions for mutations
- React Server Components for rendering

### Client State

- Zustand for cart state
- React Hook Form for form state
- URL state for filters and search

## 📊 Database Schema

See [Database Schema](Database-Schema) for detailed information about:
- Entity relationships
- Indexes and constraints
- Migration strategy

## 🔌 API Architecture

### API Routes

- RESTful API routes in `src/app/api/`
- Server actions for mutations
- Type-safe API responses

### External Integrations

- ImageKit API for image management
- Better Auth API for authentication
- Meta Pixel API for analytics

---

## 📚 Related Documentation

- [Database Schema](Database-Schema)
- [API Reference](API-Reference)
- [Configuration](Configuration)

---

*Last updated: February 2026*
