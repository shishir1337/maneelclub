# Maneel Club

<p align="center">
  <strong>Premium e-commerce platform for Maneel Club â€” a modern clothing brand experience in Bangladesh.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## Overview

**Maneel Club** is a full-stack e-commerce web application built for a premium clothing brand in Bangladesh. It delivers a fast, accessible storefront for customers and a powerful admin dashboard for managing products, orders, and business settings â€” all with a focus on local payment methods (Cash on Delivery, bKash) and delivery zones (Dhaka and outside Dhaka).

---

## Features

### Storefront (Customer)

| Feature | Description |
|--------|-------------|
| **Shop & categories** | Browse products by category with filters and search |
| **Product detail** | Variants (size, color), galleries, size guide, related products |
| **Cart & checkout** | City-based shipping (Dhaka / outside), COD & bKash |
| **User account** | Sign up / sign in (Better Auth), profile, addresses, order history |
| **Responsive UI** | Mobile-first layout with sticky bars and touch-friendly controls |
| **SEO & analytics** | Meta tags, sitemap, robots, optional Meta Pixel & GTM |

### Admin dashboard

| Area | Capabilities |
|------|--------------|
| **Dashboard** | Overview and quick access to key metrics |
| **Products** | CRUD, attributes (size, color), variants, images (MinIO or local) |
| **Categories** | Category management and product assignment |
| **Orders** | List, detail, status updates, invoice view |
| **Customers** | Customer list and basic info |
| **Hero slides** | Manage homepage hero carousel |
| **Cities** | Delivery cities and shipping configuration |
| **Attributes** | Global attributes (e.g. size, color) and values |
| **Settings** | Site-wide settings and defaults |
| **Analytics** | Basic analytics views and data |

### Technical highlights

- **Authentication:** [Better Auth](https://www.better-auth.com/) with email/password, sessions, and rate limiting
- **Database:** PostgreSQL with [Prisma](https://www.prisma.io/) ORM and migrations
- **Storage:** Product and hero images via [MinIO](https://minio.io/) or local public/uploads
- **State:** Cart and UI state with [Zustand](https://github.com/pmndrs/zustand)
- **Forms & validation:** React Hook Form with Zod schemas
- **UI:** Radix UI primitives, Tailwind CSS 4, shadcn-style components

---

## Screenshots

### 🏠 Homepage
![Homepage](https://github.com/user-attachments/assets/4a63b884-58a2-4234-82ca-084824a40ba2?raw=true)

---




## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI, Lucide icons |
| Language | TypeScript 5 |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | Better Auth |
| File storage | MinIO (S3-compatible) or local filesystem |
| Package manager | pnpm |

---

## Getting started

### Prerequisites

- **Node.js** >= 20.19.0 (see .nvmrc)
- **pnpm** (recommended) or npm / yarn
- **PostgreSQL** (local or remote)
- Optional: **MinIO** for image storage (otherwise uploads use public/uploads)

### 1. Clone and install

```bash
git clone https://github.com/shishir1337/maneelclub.git
cd maneelclub
pnpm install
```

### 2. Environment variables

Copy the example env and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Secret for Better Auth (e.g. npx @better-auth/cli secret) |
| `BETTER_AUTH_URL` | Yes | Full app URL (e.g. http://localhost:3000) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | WhatsApp contact number |
| `MINIO_*` | No | MinIO endpoint, keys, bucket (optional) |
| `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | No | Meta Pixel / Conversions API (optional) |

### 3. Database

```bash
pnpm db:migrate
pnpm db:seed
```

### 4. Run the app

```bash
pnpm dev
```

- **Storefront:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

---

## Scripts

| Script | Description |
|--------|-------------|
| pnpm dev | Start Next.js dev server |
| pnpm build | Production build |
| pnpm start | Start production server |
| pnpm lint | Run ESLint |
| pnpm db:migrate | Run Prisma migrations |
| pnpm db:push | Push schema without migrations |
| pnpm db:seed | Seed database |
| pnpm db:studio | Open Prisma Studio |
| pnpm db:reset | Reset DB and re-run migrations (destructive) |

---

## Project structure

See repository folders: prisma/, src/app (admin, auth, dashboard, shop), src/actions, src/components, src/lib, src/schemas, src/store.

---

## Configuration

- Site name, currency, contact: src/lib/constants.ts
- Shipping rates and cities: src/lib/constants.ts
- Payment methods (COD, bKash): src/lib/constants.ts
- App settings: Admin -> Settings and src/lib/settings.ts

---

## License

Proprietary. All rights reserved.

---

## Developer Contact

- **Name:** Md. Shishir Ahmed
- **Email:** mdshishirahmed811@gmail.com
- **GitHub:** https://github.com/shishir1337
- **Facebook:** https://www.facebook.com/mdshishirahmed1337/
- **WhatsApp:** +8801843596038
