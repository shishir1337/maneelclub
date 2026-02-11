# Installation Guide

Complete step-by-step guide to set up Maneel Club on your local machine or production server.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.19.0 ([Download](https://nodejs.org/))
- **pnpm** ([Install](https://pnpm.io/installation)) or npm/yarn
- **PostgreSQL** >= 14 ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional Prerequisites

- **ImageKit Account** (Recommended) - [Sign up](https://imagekit.io/) for optimized image delivery
- **MinIO** (Optional) - For S3-compatible storage fallback

---

## 🚀 Local Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/shishir1337/maneelclub.git
cd maneelclub
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This will install all required packages and automatically run `prisma generate` via the postinstall script.

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure the following variables:

#### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/maneelclub?schema=public"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-generate-with-npx-better-auth-cli-secret"
BETTER_AUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Optional Variables

```env
# ImageKit (Recommended for production)
IMAGEKIT_PRIVATE_KEY="your_private_key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-imagekit-id"
IMAGEKIT_UPLOAD_FOLDER="maneelclub"
IMAGEKIT_UPLOAD_QUALITY="80"

# MinIO (Fallback storage)
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="uploads"

# Analytics (Optional)
META_PIXEL_ID=""
META_CAPI_ACCESS_TOKEN=""
```

### Step 4: Set Up Database

#### Create PostgreSQL Database

```bash
# Using psql
createdb maneelclub

# Or using SQL
psql -U postgres
CREATE DATABASE maneelclub;
```

#### Run Migrations

```bash
pnpm db:migrate
```

This will create all necessary tables and schema.

#### Seed Database (Optional)

```bash
pnpm db:seed
```

This populates the database with sample data for testing.

### Step 5: Generate Better Auth Secret

```bash
npx @better-auth/cli secret
```

Copy the generated secret and add it to your `.env.local` file as `BETTER_AUTH_SECRET`.

### Step 6: Start Development Server

```bash
pnpm dev
```

The application will be available at:
- **Storefront:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin

---

## 🐳 Docker Setup (Optional)

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: maneelclub
      POSTGRES_PASSWORD: password
      POSTGRES_DB: maneelclub
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start PostgreSQL:

```bash
docker-compose up -d
```

---

## 🌐 Production Deployment

### Environment Variables for Production

Ensure all production environment variables are set:

```env
DATABASE_URL="postgresql://user:password@host:5432/maneelclub?schema=public"
BETTER_AUTH_SECRET="production-secret-key"
BETTER_AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
IMAGEKIT_PRIVATE_KEY="production-imagekit-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
```

### Build for Production

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start npm --name "maneelclub" -- start
pm2 save
pm2 startup
```

---

## 🔧 Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check connection string format
- Ensure database exists
- Verify user permissions

### Migration Errors

- Reset database: `pnpm db:reset` (⚠️ Destructive)
- Check Prisma schema: `pnpm db:studio`
- Review migration files in `prisma/migrations/`

### Image Upload Issues

- Verify ImageKit credentials
- Check storage service configuration
- Ensure upload directory permissions (for local storage)

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

---

## 📚 Next Steps

- Read the [Configuration Guide](Configuration)
- Explore the [Architecture](Architecture)
- Check [API Reference](API-Reference)
- Review [Deployment Guide](Deployment)

---

## 💡 Tips

- Use `pnpm db:studio` to visually inspect your database
- Enable hot reload in development for faster iteration
- Use environment-specific `.env` files (`.env.local`, `.env.production`)
- Regularly backup your database before migrations

---

*Last updated: February 2026*
