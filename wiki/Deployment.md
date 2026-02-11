# Deployment Guide

Complete guide for deploying Maneel Club to production.

## 🚀 Deployment Options

### Recommended Platforms

- **Vercel** (Recommended) - Optimized for Next.js
- **Railway** - Easy PostgreSQL integration
- **DigitalOcean App Platform** - Full control
- **AWS** - Enterprise scale
- **Self-hosted** - VPS or dedicated server

---

## 📦 Vercel Deployment

### Prerequisites

- Vercel account ([Sign up](https://vercel.com))
- GitHub repository
- PostgreSQL database (Vercel Postgres or external)

### Step-by-Step

1. **Import Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   ```
   DATABASE_URL=postgresql://...
   BETTER_AUTH_SECRET=your-secret
   BETTER_AUTH_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   IMAGEKIT_PRIVATE_KEY=your-key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
   ```

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

### Vercel Postgres Setup

1. Go to Storage → Create Database → Postgres
2. Copy connection string
3. Add to `DATABASE_URL` environment variable

---

## 🚂 Railway Deployment

### Prerequisites

- Railway account ([Sign up](https://railway.app))
- GitHub repository

### Step-by-Step

1. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Add PostgreSQL**
   - Click "+ New"
   - Select "Postgres"
   - Railway will create database automatically

3. **Configure Environment Variables**
   - Go to Variables tab
   - Add all required variables
   - Railway will auto-detect `DATABASE_URL` from Postgres service

4. **Deploy**
   - Railway will auto-deploy on push to main branch
   - Check deployment logs

---

## 🐳 Docker Deployment

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/maneelclub
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=maneelclub
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy

```bash
docker-compose up -d
```

---

## 🔧 Production Configuration

### Environment Variables

Ensure all production variables are set:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/db
BETTER_AUTH_SECRET=production-secret-key
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Recommended
IMAGEKIT_PRIVATE_KEY=your-production-key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id

# Optional
META_PIXEL_ID=your-pixel-id
META_CAPI_ACCESS_TOKEN=your-token
```

### Next.js Configuration

Update `next.config.ts`:

```typescript
const nextConfig = {
  reactCompiler: true,
  output: 'standalone', // For Docker
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
}
```

### Database Migrations

Run migrations before first deployment:

```bash
pnpm db:migrate
pnpm db:seed  # Optional: seed initial data
```

---

## 🔐 Security Checklist

- [ ] Strong `BETTER_AUTH_SECRET` (use `npx @better-auth/cli secret`)
- [ ] HTTPS enabled
- [ ] Environment variables secured (not in code)
- [ ] Database credentials secure
- [ ] ImageKit credentials secure
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Prisma handles this)

---

## 📊 Performance Optimization

### Image Optimization

- Use ImageKit for all production images
- Set `IMAGEKIT_UPLOAD_QUALITY` appropriately
- Use Next.js Image component

### Database Optimization

- Use connection pooling
- Add indexes for frequently queried fields
- Monitor slow queries

### Caching

- Enable CDN caching for static assets
- Use Next.js static generation where possible
- Cache API responses appropriately

---

## 🔍 Monitoring

### Recommended Tools

- **Vercel Analytics** - Built-in analytics
- **Sentry** - Error tracking
- **PostgreSQL Monitoring** - Database performance
- **Uptime Monitoring** - UptimeRobot, Pingdom

### Health Checks

Create `/api/health` route:

```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date() })
}
```

---

## 🚨 Troubleshooting

### Build Failures

- Check build logs for errors
- Verify all environment variables are set
- Ensure Node.js version matches (>= 20.19.0)
- Check database connection

### Runtime Errors

- Check application logs
- Verify database migrations ran
- Check environment variables
- Verify external service connections (ImageKit, etc.)

### Database Connection Issues

- Verify connection string format
- Check firewall rules
- Verify database is accessible
- Check SSL requirements

---

## 🔄 CI/CD Setup

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm build
      # Add deployment steps here
```

---

## 📚 Platform-Specific Guides

### Vercel

- [Vercel Documentation](https://vercel.com/docs)
- Automatic deployments on push
- Built-in analytics and monitoring

### Railway

- [Railway Documentation](https://docs.railway.app)
- Easy PostgreSQL integration
- Automatic deployments

### DigitalOcean

- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)
- Managed PostgreSQL available
- Custom domains support

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Image uploads working
- [ ] Authentication working
- [ ] Admin dashboard accessible
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Error tracking set up
- [ ] Backup strategy in place

---

## 📞 Support

For deployment issues:
- Check [Common Issues](Common-Issues)
- Open an issue on GitHub
- Contact: mdshishirahmed811@gmail.com

---

*Last updated: February 2026*
