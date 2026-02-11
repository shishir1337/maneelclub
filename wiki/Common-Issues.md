# Common Issues & Solutions

Troubleshooting guide for common issues in Maneel Club.

## 🐛 Database Issues

### Database Connection Failed

**Symptoms:**
- Error: `Can't reach database server`
- Migration failures
- Connection timeout errors

**Solutions:**

1. **Check PostgreSQL is running**
   ```bash
   # Linux/Mac
   sudo systemctl status postgresql
   
   # Windows
   # Check Services panel
   ```

2. **Verify connection string**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/maneelclub?schema=public"
   ```

3. **Check database exists**
   ```bash
   psql -U postgres -l
   # Look for maneelclub database
   ```

4. **Test connection**
   ```bash
   psql $DATABASE_URL
   ```

---

### Migration Errors

**Symptoms:**
- `Migration failed`
- `Table already exists`
- `Column does not exist`

**Solutions:**

1. **Reset database (⚠️ Destructive)**
   ```bash
   pnpm db:reset
   ```

2. **Check migration status**
   ```bash
   pnpm db:migrate status
   ```

3. **Manually fix migration**
   - Check `prisma/migrations/` folder
   - Review migration SQL files
   - Fix conflicts manually

---

## 🔐 Authentication Issues

### Login Not Working

**Symptoms:**
- Login form submits but nothing happens
- Redirect loops
- Session not created

**Solutions:**

1. **Check Better Auth secret**
   ```bash
   npx @better-auth/cli secret
   # Copy and add to BETTER_AUTH_SECRET
   ```

2. **Verify URLs match**
   ```env
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Check cookies**
   - Open browser DevTools
   - Check Application → Cookies
   - Verify session cookie exists

4. **Clear browser cache**
   - Clear cookies and cache
   - Try incognito/private mode

---

### Session Expired Too Quickly

**Symptoms:**
- Logged out unexpectedly
- Session expires too soon

**Solutions:**

1. **Check session configuration**
   ```typescript
   // src/lib/auth.ts
   session: {
     expiresIn: 60 * 60 * 24 * 7, // 7 days
     updateAge: 60 * 60 * 24, // 1 day
   }
   ```

2. **Increase expiration time**
   - Adjust `expiresIn` value
   - Restart server

---

## 🖼️ Image Upload Issues

### Images Not Uploading

**Symptoms:**
- Upload fails silently
- Error messages
- Images not appearing

**Solutions:**

1. **Check ImageKit configuration**
   ```env
   IMAGEKIT_PRIVATE_KEY="your-key"
   IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-id"
   ```

2. **Verify storage service**
   - Check storage priority in `src/lib/storage.ts`
   - ImageKit → MinIO → Local

3. **Check file size**
   - Default limit: 10MB
   - Increase in `next.config.ts` if needed

4. **Test local storage**
   - Remove ImageKit/MinIO configs
   - Test with local storage
   - Check `public/uploads/` directory

---

### ImageKit Upload Fails

**Symptoms:**
- `ImageKit upload failed`
- `Invalid credentials`

**Solutions:**

1. **Verify credentials**
   - Check ImageKit dashboard
   - Regenerate private key if needed

2. **Check URL endpoint**
   ```env
   IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-imagekit-id"
   ```

3. **Test ImageKit connection**
   ```typescript
   import ImageKit from '@imagekit/nodejs'
   
   const imagekit = new ImageKit({
     privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
   })
   
   // Test upload
   ```

---

## 🚀 Build & Deployment Issues

### Build Fails

**Symptoms:**
- `pnpm build` fails
- TypeScript errors
- Missing dependencies

**Solutions:**

1. **Clear cache**
   ```bash
   rm -rf .next
   rm -rf node_modules
   pnpm install
   ```

2. **Check Node version**
   ```bash
   node --version  # Should be >= 20.19.0
   ```

3. **Verify dependencies**
   ```bash
   pnpm install --frozen-lockfile
   ```

4. **Check TypeScript errors**
   ```bash
   pnpm tsc --noEmit
   ```

---

### Production Build Issues

**Symptoms:**
- Build succeeds but app doesn't work
- Missing environment variables
- API routes not working

**Solutions:**

1. **Check environment variables**
   - Verify all required vars are set
   - Check production environment config

2. **Verify build output**
   ```bash
   pnpm build
   # Check .next folder exists
   ```

3. **Test production build locally**
   ```bash
   pnpm build
   pnpm start
   ```

---

## 🔧 Performance Issues

### Slow Page Loads

**Symptoms:**
- Pages load slowly
- Images take time to load
- Database queries slow

**Solutions:**

1. **Enable ImageKit**
   - Use CDN for images
   - Enable automatic optimization

2. **Add database indexes**
   ```prisma
   model Product {
     @@index([isActive])
     @@index([isFeatured])
   }
   ```

3. **Optimize queries**
   - Use `select` to limit fields
   - Add pagination
   - Use `include` wisely

4. **Enable caching**
   - Use Next.js static generation
   - Cache API responses
   - Use CDN caching

---

### High Memory Usage

**Symptoms:**
- Server crashes
- Out of memory errors
- Slow performance

**Solutions:**

1. **Check connection pooling**
   ```env
   DATABASE_URL="...?connection_limit=10"
   ```

2. **Limit query results**
   ```typescript
   const products = await prisma.product.findMany({
     take: 20, // Limit results
   })
   ```

3. **Monitor memory usage**
   - Use monitoring tools
   - Check server logs
   - Optimize queries

---

## 🎨 UI/UX Issues

### Styles Not Loading

**Symptoms:**
- No styling applied
- Tailwind classes not working
- CSS missing

**Solutions:**

1. **Check Tailwind config**
   ```bash
   # Verify tailwind.config.ts exists
   ```

2. **Rebuild CSS**
   ```bash
   rm -rf .next
   pnpm dev
   ```

3. **Verify PostCSS config**
   ```javascript
   // postcss.config.mjs
   export default {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```

---

### Components Not Rendering

**Symptoms:**
- Blank pages
- Components missing
- Hydration errors

**Solutions:**

1. **Check browser console**
   - Look for JavaScript errors
   - Check React errors

2. **Verify component imports**
   ```typescript
   import { Component } from '@/components/ui/component'
   ```

3. **Check server/client mismatch**
   - Ensure consistent rendering
   - Use `use client` directive where needed

---

## 📧 Email Issues

### Emails Not Sending

**Symptoms:**
- No email notifications
- Email errors in logs

**Solutions:**

1. **Check email configuration**
   - Verify SMTP settings
   - Check email service provider

2. **Test email service**
   - Use test credentials
   - Check spam folder

3. **Check logs**
   - Review server logs
   - Check email service logs

---

## 🔍 Debugging Tips

### Enable Debug Logging

```typescript
// Add to .env.local
DEBUG=*
```

### Check Prisma Queries

```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### Browser DevTools

- Check Network tab for API calls
- Check Console for errors
- Check Application tab for storage

---

## 📞 Getting Help

If you can't resolve an issue:

1. **Check existing issues**
   - Search GitHub issues
   - Check closed issues

2. **Create new issue**
   - Provide error messages
   - Include steps to reproduce
   - Add environment details

3. **Contact support**
   - Email: mdshishirahmed811@gmail.com
   - GitHub: [@shishir1337](https://github.com/shishir1337)

---

## 📚 Related Documentation

- [Installation Guide](Installation)
- [Configuration](Configuration)
- [Deployment](Deployment)

---

*Last updated: February 2026*
