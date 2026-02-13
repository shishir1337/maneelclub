# Configuration Guide

Complete guide to configuring Maneel Club for your environment.

## 🔧 Environment Variables

### Required Variables

#### Database Configuration

```env
DATABASE_URL="postgresql://user:password@localhost:5432/maneelclub?schema=public"
```

**Format:** `postgresql://[user]:[password]@[host]:[port]/[database]?schema=[schema]`

#### Authentication Configuration

```env
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

**Generate Secret:**
```bash
npx @better-auth/cli secret
```

#### Application URLs

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### Optional Variables

#### ImageKit Configuration (Recommended)

```env
# Required for ImageKit integration
IMAGEKIT_PRIVATE_KEY="private_xxxxxxxxxxxxxxxxxxxxx"

# Optional: URL endpoint for image URLs
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-imagekit-id"

# Optional: Default upload folder
IMAGEKIT_UPLOAD_FOLDER="maneelclub"

# Optional: Image quality (1-100, default: 80)
IMAGEKIT_UPLOAD_QUALITY="80"
```

**Get ImageKit Credentials:**
1. Sign up at [ImageKit.io](https://imagekit.io/)
2. Go to Developer Options → API Keys
3. Copy Private Key
4. Copy URL Endpoint

#### MinIO Configuration (Fallback Storage)

```env
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="uploads"
```

#### WhatsApp Integration

```env
NEXT_PUBLIC_WHATSAPP_NUMBER="+8801997193518"
```

#### Courier fraud check (BDCourier API)

Optional. When set, admins can check a customer’s courier status by phone from the order page (to help spot fake or spam orders). Results are cached per order and refreshed manually.

```env
BDCOURIER_API_KEY="your-bdcourier-api-key"
```

Get your key from [BDCourier](https://api.bdcourier.com). If unset, the “Refresh data” courier check is disabled and the UI shows “Courier check not configured”.

#### Analytics (Meta Pixel)

```env
META_PIXEL_ID="your-pixel-id"
META_CAPI_ACCESS_TOKEN="your-access-token"
```

#### Social Auth (Future Use)

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

---

## ⚙️ Application Settings

### Site Configuration

Edit `src/lib/constants.ts`:

```typescript
export const siteConfig = {
  name: "Maneel Club",
  description: "Premium clothing brand in Bangladesh",
  email: "support@maneelclub.com",
  phone: "+8801997193518",
  whatsapp: "+8801997193518",
  facebook: "https://www.facebook.com/maneelclub",
  // ... more settings
}
```

### Shipping Configuration

Configure shipping rates in `src/lib/constants.ts`:

```typescript
export const shippingRates = {
  inside_dhaka: 80,
  outside_dhaka: 130,
  free_shipping_minimum: 2000,
}
```

### Payment Methods

Payment methods are configured in the database via Admin Dashboard → Settings.

Available methods:
- Cash on Delivery (COD)
- bKash
- Nagad
- Rocket

---

## 🗄️ Database Configuration

### Connection Pooling

For production, use connection pooling:

```env
DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true&connection_limit=10"
```

### SSL Connection

```env
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```

---

## 🖼️ Image Storage Configuration

### Priority Order

The system checks storage services in this order:

1. **ImageKit** (if `IMAGEKIT_PRIVATE_KEY` is set)
2. **MinIO** (if MinIO variables are set)
3. **Local Filesystem** (fallback to `public/uploads/`)

### ImageKit Setup

1. Create account at [ImageKit.io](https://imagekit.io/)
2. Get Private Key from Developer Options
3. Set `IMAGEKIT_PRIVATE_KEY` in `.env.local`
4. Optionally set `IMAGEKIT_URL_ENDPOINT` and `IMAGEKIT_UPLOAD_FOLDER`

### MinIO Setup

1. Install MinIO: `docker run -p 9000:9000 minio/minio server /data`
2. Create bucket named `uploads`
3. Set MinIO environment variables
4. Access MinIO console at http://localhost:9001

### Local Storage

If neither ImageKit nor MinIO is configured, files are stored in `public/uploads/`.

**Note:** Local storage doesn't work in production builds. Use ImageKit or MinIO for production.

---

## 🔐 Security Configuration

### Better Auth Configuration

Edit `src/lib/auth.ts`:

```typescript
export const auth = betterAuth({
  database: prismaAdapter(prisma),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  rateLimit: {
    window: 60 * 1000, // 1 minute
    max: 5, // 5 requests per window
  },
})
```

### CORS Configuration

Configure in `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}
```

---

## 📊 Analytics Configuration

### Meta Pixel Setup

1. Create Meta Pixel in Facebook Business Manager
2. Get Pixel ID
3. Set `META_PIXEL_ID` in environment variables
4. Optionally set `META_CAPI_ACCESS_TOKEN` for Conversions API

### Google Tag Manager

Configure in Admin Dashboard → Settings → Analytics:

1. Get GTM Container ID (format: `GTM-XXXXXXX`)
2. Enter in settings
3. GTM script will be injected automatically

---

## 🚀 Performance Configuration

### Next.js Configuration

Edit `next.config.ts`:

```typescript
const nextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
    ],
  },
  experimental: {
    proxyClientMaxBodySize: '10mb',
  },
}
```

### Image Optimization

- ImageKit handles automatic optimization
- Set `IMAGEKIT_UPLOAD_QUALITY` for compression (default: 80)
- Use Next.js Image component for lazy loading

---

## 🌍 Environment-Specific Configuration

### Development

Use `.env.local`:

```env
DATABASE_URL="postgresql://localhost:5432/maneelclub"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production

Set environment variables in your hosting platform:

- **Vercel:** Project Settings → Environment Variables
- **Railway:** Variables tab
- **DigitalOcean:** App Settings → Environment Variables

---

## ✅ Configuration Checklist

- [ ] Database connection string configured
- [ ] Better Auth secret generated and set
- [ ] Application URLs configured
- [ ] ImageKit credentials set (recommended)
- [ ] WhatsApp number configured (optional)
- [ ] Analytics configured (optional)
- [ ] Shipping rates configured
- [ ] Payment methods configured via admin
- [ ] Site information updated in constants

---

## 🔍 Verifying Configuration

### Check Database Connection

```bash
pnpm db:studio
```

### Test Image Upload

1. Go to Admin → Products → New Product
2. Upload an image
3. Check if it appears correctly

### Verify Authentication

1. Try logging in
2. Check browser cookies for session
3. Verify protected routes work

---

## 📚 Related Documentation

- [Installation Guide](Installation)
- [Architecture](Architecture)
- [Deployment](Deployment)

---

*Last updated: February 2026*
