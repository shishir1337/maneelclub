# Deployment & Run Guide — Maneel Club

Quick reference for running locally and deploying to production.

## Run locally

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local: set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WHATSAPP_NUMBER
pnpm prisma migrate dev
pnpm run db:seed   # optional
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production deploy

1. **Environment variables** (set in your host, e.g. Vercel):

   - `DATABASE_URL` — PostgreSQL connection string  
   - `BETTER_AUTH_SECRET` — from `npx @better-auth/cli secret`  
   - `BETTER_AUTH_URL` — `https://yourdomain.com`  
   - `NEXT_PUBLIC_APP_URL` — `https://yourdomain.com`  
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — e.g. `+8801997193518`  
   - Optional: `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` for Meta ads  
   - Optional: `MINIO_*` if using MinIO; otherwise uploads use `public/uploads`

2. **Build & DB**

   ```bash
   pnpm install
   pnpm prisma generate
   pnpm prisma migrate deploy
   pnpm build
   pnpm start
   ```

3. **After first deploy**

   - Create first admin (sign up then set `role = 'ADMIN'` in DB, or use seed).  
   - In **Admin → Settings**: shipping rates, bKash/Nagad/Rocket numbers, GTM/Pixel if used.  
   - In **Admin → Hero** and **Admin → Cities**: add content.

See **PRODUCTION_AND_HANDOVER_CHECKLIST.md** for the full pre-deploy checklist and handover notes.
