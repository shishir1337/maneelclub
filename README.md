<div align="center">

# 🛍️ Maneel Club

**Premium E-Commerce Platform | Modern Clothing Brand Experience**

*A full-stack e-commerce solution built with cutting-edge technologies for Bangladesh's premier clothing brand*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[![Better Auth](https://img.shields.io/badge/Better_Auth-1.4-000000?style=flat-square&logo=key)](https://www.better-auth.com/)
[![ImageKit](https://img.shields.io/badge/ImageKit-CDN-FF6B6B?style=flat-square)](https://imagekit.io/)
[![Zustand](https://img.shields.io/badge/Zustand-State-FF6B6B?style=flat-square)](https://github.com/pmndrs/zustand)

</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📸 Screenshots](#-screenshots)
- [⚡ Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [⚙️ Configuration](#️-configuration)
- [📝 Scripts](#-scripts)
- [👨‍💻 Developer](#-developer)

---

## ✨ Overview

**Maneel Club** is a production-ready, full-stack e-commerce platform designed specifically for premium clothing brands. Built with modern web technologies, it delivers a lightning-fast shopping experience for customers and a powerful, intuitive admin dashboard for managing your entire business.

### 🎯 Key Highlights

- ⚡ **Blazing Fast** - Built on Next.js 16 with React Server Components
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS 4
- 🔒 **Secure** - Better Auth with session management and rate limiting
- 📦 **Scalable** - ImageKit CDN for optimized image delivery
- 💳 **Local Payments** - Cash on Delivery, bKash, Nagad, Rocket support
- 📊 **Analytics Ready** - Meta Pixel & Google Tag Manager integration
- 🚚 **Smart Shipping** - Zone-based delivery (Dhaka & Outside Dhaka)

---

## 🚀 Features

### 🛒 Customer Storefront

| Feature | Description |
|---------|-------------|
| 🏪 **Shop & Browse** | Intuitive product browsing with category filters and search functionality |
| 🎨 **Product Details** | Rich product pages with variants (size, color), image galleries, size guides, and related products |
| 🛍️ **Shopping Cart** | Seamless cart management with real-time updates |
| 💰 **Checkout** | Streamlined checkout with city-based shipping calculation (Dhaka / Outside Dhaka) |
| 💳 **Payment Options** | Support for Cash on Delivery (COD), bKash, Nagad, and Rocket |
| 👤 **User Accounts** | Complete user profiles with address management and order history |
| 📱 **Mobile Optimized** | Fully responsive, mobile-first design with touch-friendly controls |
| 🔍 **SEO Optimized** | Meta tags, sitemap, robots.txt, and optional analytics integration |

### 🎛️ Admin Dashboard

| Module | Capabilities |
|--------|-------------|
| 📊 **Dashboard** | Real-time overview with key metrics and quick access to important data |
| 📦 **Products** | Full CRUD operations, variant management, attribute assignment, and ImageKit integration |
| 📁 **Categories** | Flexible category management with product assignment |
| 📋 **Orders** | Complete order management with status tracking, invoice generation, and customer details |
| 👥 **Customers** | Customer database with profile information and order history |
| 🎠 **Hero Slides** | Dynamic homepage carousel management |
| 🏙️ **Cities** | Delivery zone configuration and shipping rate management |
| 🏷️ **Attributes** | Global attribute system (sizes, colors, etc.) with custom values |
| ⚙️ **Settings** | Comprehensive site-wide settings and configuration |
| 📈 **Analytics** | Built-in analytics views and data visualization |

### 🔧 Technical Features

- 🔐 **Authentication** - [Better Auth](https://www.better-auth.com/) with email/password, secure sessions, and rate limiting
- 🗄️ **Database** - PostgreSQL with [Prisma](https://www.prisma.io/) ORM, migrations, and type-safe queries
- 📸 **Image Storage** - [ImageKit](https://imagekit.io/) CDN (primary) with automatic optimization, fallback to MinIO or local storage
- 🎯 **State Management** - [Zustand](https://github.com/pmndrs/zustand) for cart and UI state
- ✅ **Form Validation** - React Hook Form with Zod schema validation
- 🎨 **UI Components** - Radix UI primitives with Tailwind CSS 4 and shadcn-style components
- 🚀 **Performance** - Server-side rendering, code splitting, and optimized image delivery

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:-----:|:----------:|:--------|
| **Framework** | Next.js 16 (App Router) | React framework with SSR and API routes |
| **UI Library** | React 19 | Modern React with Server Components |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework |
| **Components** | Radix UI + Lucide Icons | Accessible component primitives |
| **Language** | TypeScript 5 | Type-safe JavaScript |
| **Database** | PostgreSQL | Robust relational database |
| **ORM** | Prisma 7 | Type-safe database access |
| **Authentication** | Better Auth | Secure auth with sessions |
| **File Storage** | ImageKit (Primary) | CDN with image optimization |
| **State** | Zustand | Lightweight state management |
| **Forms** | React Hook Form + Zod | Form handling and validation |
| **Package Manager** | pnpm | Fast, disk space efficient |

</div>

---

## 📸 Screenshots

### 🏠 Homepage

![Homepage](https://github.com/user-attachments/assets/4a63b884-58a2-4234-82ca-084824a40ba2?raw=true)

*More screenshots coming soon...*

---

## ⚡ Quick Start

### 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.19.0 ([Download](https://nodejs.org/))
- **pnpm** ([Install](https://pnpm.io/installation)) or npm/yarn
- **PostgreSQL** ([Download](https://www.postgresql.org/download/))
- **ImageKit Account** (Recommended) - [Sign up](https://imagekit.io/) for optimized image delivery
- **MinIO** (Optional) - For S3-compatible storage fallback

### 🚀 Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/shishir1337/maneelclub.git
cd maneelclub
```

#### 2️⃣ Install Dependencies

```bash
pnpm install
```

#### 3️⃣ Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the following variables:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | Secret key for Better Auth (generate with `npx @better-auth/cli secret`) |
| `BETTER_AUTH_URL` | ✅ | Full app URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | ❌ | WhatsApp contact number |
| `IMAGEKIT_PRIVATE_KEY` | ⭐ | ImageKit private key (recommended for production) |
| `IMAGEKIT_URL_ENDPOINT` | ❌ | ImageKit URL endpoint (e.g., `https://ik.imagekit.io/your-id`) |
| `IMAGEKIT_UPLOAD_FOLDER` | ❌ | ImageKit upload folder (default: `maneelclub`) |
| `IMAGEKIT_UPLOAD_QUALITY` | ❌ | Image upload quality 1-100 (default: `80`) |
| `MINIO_*` | ❌ | MinIO configuration (fallback if ImageKit not configured) |
| `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` | ❌ | Meta Pixel / Conversions API (optional) |

#### 4️⃣ Set Up Database

Run migrations and seed the database:

```bash
pnpm db:migrate
pnpm db:seed
```

#### 5️⃣ Start Development Server

```bash
pnpm dev
```

🎉 **You're all set!** Visit:
- **Storefront:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

---

## 📁 Project Structure

```
maneelclub/
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma      # Prisma schema definition
│   └── migrations/        # Database migration files
├── public/                 # Static assets
│   └── uploads/           # Local file uploads (fallback)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── (admin)/       # Admin dashboard routes
│   │   ├── (shop)/        # Storefront routes
│   │   ├── api/           # API routes
│   │   └── auth/          # Authentication pages
│   ├── actions/           # Server actions
│   │   ├── admin/         # Admin-specific actions
│   │   └── ...            # Other actions
│   ├── components/        # React components
│   │   ├── admin/         # Admin components
│   │   └── ...            # Shared components
│   ├── lib/               # Utility libraries
│   │   ├── auth.ts        # Better Auth configuration
│   │   ├── storage.ts     # Storage service (ImageKit/MinIO/Local)
│   │   └── ...            # Other utilities
│   ├── schemas/           # Zod validation schemas
│   └── store/             # Zustand stores
├── .env.example           # Environment variables template
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

---

## ⚙️ Configuration

### Site Settings

- **Store Information** - `src/lib/constants.ts`
- **Shipping Rates** - `src/lib/constants.ts`
- **Payment Methods** - `src/lib/constants.ts`
- **App Settings** - Admin Dashboard → Settings or `src/lib/settings.ts`

### Storage Configuration

The platform supports multiple storage backends with automatic fallback:

1. **ImageKit** (Primary) - CDN with automatic image optimization
2. **MinIO** (Fallback) - S3-compatible object storage
3. **Local Filesystem** (Fallback) - `public/uploads/` directory

Configure storage via environment variables (see [Quick Start](#-quick-start)).

---

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:push` | Push schema changes without migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:reset` | Reset database and re-run migrations ⚠️ |

---

## 👨‍💻 Developer

<div align="center">

**Md. Shishir Ahmed**

[![Email](https://img.shields.io/badge/Email-mdshishirahmed811@gmail.com-D14836?style=flat-square&logo=gmail)](mailto:mdshishirahmed811@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-shishir1337-181717?style=flat-square&logo=github)](https://github.com/shishir1337)
[![Facebook](https://img.shields.io/badge/Facebook-mdshishirahmed1337-1877F2?style=flat-square&logo=facebook)](https://www.facebook.com/mdshishirahmed1337/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-+8801843596038-25D366?style=flat-square&logo=whatsapp)](https://wa.me/8801843596038)

</div>

---

## 📄 License

**Proprietary** - All rights reserved.

---

<div align="center">

**Made with ❤️ for Maneel Club**

⭐ Star this repo if you find it helpful!

</div>
