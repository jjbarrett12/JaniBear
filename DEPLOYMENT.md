# Deployment Guide

**Easiest:** Double-click **deploy-easy.bat** in the JaniBear folder. See **DEPLOY.md** for the short version.

---

## Pre-Deployment Checklist

### ✅ 1. Environment Variables
Ensure all environment variables are set in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_ENTERPRISE_PRICE_ID`

### ✅ 2. Database Migrations
All migrations should be run in production Supabase:
- `001_initial_schema.sql`
- `002_rls_policies.sql`
- `003_create_storage_bucket.sql`

### ✅ 3. Supabase Configuration
- Update Site URL to production domain
- Add production redirect URLs:
  - `https://yourdomain.com/auth/callback`
  - `https://yourdomain.com/auth/reset-password`
- Configure email templates (optional)
- Set up email provider (if using email confirmations)

### ✅ 4. Stripe Configuration
- Switch to live mode
- Update webhook endpoint to production URL
- Use live API keys
- Test payment flow

## Deployment Options

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Add Environment Variables** (required to avoid 404 / NOT_FOUND)
   - Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
   - Add these for **Production**, **Preview**, and **Development** (or at least Production):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://YOUR-PROJECT.supabase.co` (no trailing slash)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your project’s anon/public key from Supabase
   - (Optional) `NEXT_PUBLIC_APP_URL` = your app URL, e.g. `https://your-app.vercel.app` (no trailing slash)
   - Add Stripe and other variables from the Pre-Deployment Checklist above.
   - **Redeploy** after adding or changing env vars (Deployments → ⋮ → Redeploy).

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify

1. **Connect Repository**
   - Link GitHub/GitLab repo in Netlify dashboard

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Environment Variables**
   - Add in Site Settings → Environment Variables

### Self-Hosted

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

3. **Use PM2 for Process Management**
   ```bash
   npm install -g pm2
   pm2 start npm --name "janibear" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment

### ✅ 1. Test Critical Flows
- [ ] User signup
- [ ] User login
- [ ] Password reset
- [ ] Payment checkout
- [ ] Webhook processing

### ✅ 2. Monitor
- Check application logs
- Monitor Supabase dashboard
- Check Stripe dashboard for payments
- Set up error tracking (Sentry, etc.)

### ✅ 3. Performance
- Enable Next.js Image Optimization
- Set up CDN (if not using Vercel)
- Configure caching headers

### ✅ 4. Security
- Enable HTTPS only
- Set secure cookie flags
- Review RLS policies
- Set up rate limiting

## Environment-Specific Configuration

### Development
- Use test Stripe keys
- Local Supabase or dev project
- Debug mode enabled

### Staging
- Use test Stripe keys
- Separate Supabase project
- Production-like configuration

### Production
- Use live Stripe keys
- Production Supabase project
- All optimizations enabled

## Troubleshooting Deployment

### Build Errors
- Check Node.js version (18+)
- Verify all dependencies installed
- Check for TypeScript errors

### Runtime Errors
- Verify environment variables
- Check Supabase connection
- Review server logs

### 404 NOT_FOUND on Vercel
**Full checklist:** See [VERCEL_404_CHECKLIST.md](./VERCEL_404_CHECKLIST.md). Most common cause: **Output Directory** overridden in Vercel — leave it empty and redeploy.

1. **Check which URL 404s**  
   Try `https://your-app.vercel.app/api/health` — if it returns `{"ok":true,"env":true}`, the app is running and the 404 is for a specific page; if it also 404s, the deployment or routing is wrong.

2. **Vercel project settings**
   - **Root Directory**: If the repo has JaniBear in a subfolder, set Root Directory to that folder (e.g. `JaniBear`).
   - **Framework Preset**: Should be "Next.js" (auto-detected from `package.json`).
   - **Build Command**: `npm run build` (or leave default).
   - **Output Directory**: Leave **empty** (do not override). If set to `out` or `public`, clear it and redeploy.

3. **Environment variables**
   - In Vercel: Settings → Environment Variables.
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview, and Development.
   - Redeploy after changing env vars (Deployments → ⋮ → Redeploy).

4. **Redeploy**
   - After changing env or settings, trigger a new deployment (push a commit or Redeploy from the dashboard).

### Performance Issues
- Enable Next.js caching
- Optimize images
- Review database queries

---

For more help, see TROUBLESHOOTING.md
