# Deployment Guide

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

2. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables

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

### Performance Issues
- Enable Next.js caching
- Optimize images
- Review database queries

---

For more help, see TROUBLESHOOTING.md
