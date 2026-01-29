# Troubleshooting Guide

## Common Issues and Solutions

### 🔐 Authentication Issues

#### "Invalid login credentials"
**Possible Causes:**
- Wrong email or password
- Account doesn't exist
- Email not confirmed (if email confirmation is enabled)

**Solutions:**
1. Double-check email and password
2. Try "Forgot password" to reset
3. Check Supabase Dashboard → Authentication → Users to verify account exists
4. If email confirmation is enabled, check your email for confirmation link
5. Disable email confirmation in Supabase Dashboard → Authentication → Settings (for testing)

#### "Email not confirmed"
**Solution:**
- Check your email inbox (and spam folder) for confirmation link
- Click the confirmation link
- OR disable email confirmation in Supabase settings for testing

#### Can't sign up / "User already exists"
**Solution:**
- Check if account already exists in Supabase Dashboard
- Try signing in instead
- Use "Forgot password" if you don't remember your password

#### Password reset link not working
**Solution:**
- Check that redirect URL is configured in Supabase:
  - Go to Authentication → URL Configuration
  - Add: `http://localhost:3000/auth/reset-password`
- Links expire after 1 hour - request a new one
- Check email spam folder

### 🗄️ Database Issues

#### "relation does not exist" or table errors
**Solution:**
- Make sure you've run all migrations in order:
  1. `001_initial_schema.sql`
  2. `002_rls_policies.sql`
  3. `003_create_storage_bucket.sql`
- Check Supabase Dashboard → Database → Tables to verify tables exist

#### RLS policy errors / "new row violates row-level security policy"
**Solution:**
- Verify RLS policies are enabled and correct
- Check that user has proper role in `org_members` table
- Ensure `org_id` is being set correctly

### 💳 Payment Issues

#### Stripe checkout not working
**Possible Causes:**
- Missing or incorrect Stripe keys in `.env.local`
- Invalid Price IDs
- Webhook not configured

**Solutions:**
1. Verify all Stripe keys in `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
2. Check Price IDs match products in Stripe Dashboard
3. Ensure webhook endpoint is configured in Stripe Dashboard

#### "Invalid plan ID" error
**Solution:**
- Verify Price IDs in `.env.local` match Stripe Dashboard
- Price IDs should start with `price_`
- Make sure products are active in Stripe

### 🖼️ Image/Storage Issues

#### Can't upload photos
**Possible Causes:**
- Storage bucket not created
- RLS policies not set up
- Missing storage permissions

**Solutions:**
1. Run `003_create_storage_bucket.sql` migration
2. Check Supabase Dashboard → Storage → Buckets
3. Verify `inspection-photos` bucket exists
4. Check bucket policies in Storage settings

#### Images not displaying
**Solution:**
- Verify image URLs are correct
- Check Supabase Storage bucket is public
- Ensure `next.config.mjs` has Supabase hostname in `remotePatterns`

### 🚀 Development Server Issues

#### "Site can't be reached" / Port already in use
**Solution:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Then restart:
npm run dev
```

#### Build errors / TypeScript errors
**Solution:**
1. Clear `.next` folder: `rm -rf .next` (or delete manually)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for missing imports
4. Verify all environment variables are set

#### "Module not found" errors
**Solution:**
- Run `npm install` to ensure all dependencies are installed
- Check `package.json` has the required package
- Restart dev server after installing new packages

### 🔧 Environment Variable Issues

#### "Your project's URL and Key are required"
**Solution:**
- Create `.env.local` file in root directory
- Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding variables
- Variables starting with `NEXT_PUBLIC_` are required for client-side code

#### Environment variables not loading
**Solution:**
- Ensure file is named exactly `.env.local` (not `.env.local.txt`)
- Restart dev server after changing `.env.local`
- Check for typos in variable names
- Verify no extra spaces or quotes around values

### 📱 Mobile/Responsive Issues

#### Layout looks broken on mobile
**Solution:**
- Clear browser cache
- Check TailwindCSS classes are correct
- Verify viewport meta tag in `layout.tsx`
- Test in different browsers/devices

### 🔄 Redirect Issues

#### Infinite redirect loops
**Solution:**
- Check middleware logic in `src/lib/supabase/middleware.ts`
- Verify route exclusions are correct
- Check if user is properly authenticated
- Clear browser cookies and try again

#### Wrong redirect after login
**Solution:**
- Check onboarding status in `org_members` table
- Verify redirect logic in login form
- Ensure user has completed onboarding if needed

## 🆘 Getting More Help

1. **Check Browser Console**: Open DevTools (F12) → Console tab for errors
2. **Check Server Logs**: Look at terminal where `npm run dev` is running
3. **Check Supabase Logs**: Dashboard → Logs → API or Database
4. **Verify Configuration**: Double-check all environment variables and settings

## 📝 Debug Checklist

Before asking for help, verify:
- [ ] All migrations have been run
- [ ] `.env.local` is properly configured
- [ ] Supabase project is active and accessible
- [ ] User account exists in Supabase Dashboard
- [ ] Browser console shows no errors
- [ ] Dev server is running without errors
- [ ] Dependencies are installed (`npm install` completed)

---

**Still stuck?** Check the main README.md and SETUP_GUIDE.md for detailed setup instructions.
