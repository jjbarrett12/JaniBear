# Janibear Setup Guide

## Quick Start Checklist

### ✅ 1. Install Dependencies
```bash
npm install
```

### ✅ 2. Configure Environment Variables

Create `.env.local` with your credentials:

```env
# Get these from Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Get these from Stripe Dashboard → Developers → API keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Create products in Stripe Dashboard → Products, then copy Price IDs
STRIPE_STARTER_PRICE_ID=price_xxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxx
```

### ✅ 3. Set Up Supabase Database

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `001_initial_schema.sql` - Creates all tables
   - `002_rls_policies.sql` - Sets up security
   - `003_create_storage_bucket.sql` - Creates photo storage

### ✅ 4. Configure Supabase Auth

1. Go to Supabase Dashboard → Authentication → Settings
2. **For Testing**: Disable "Enable email confirmations" (optional)
3. **Site URL**: Set to `http://localhost:3000` (development)
4. **Redirect URLs**: Add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/reset-password`

### ✅ 5. Set Up Stripe (Optional - for payments)

1. Create account at https://stripe.com
2. Go to Products → Create 3 products:
   - Starter ($49/month)
   - Professional ($149/month)
   - Enterprise ($399/month)
3. Copy the Price IDs to `.env.local`
4. Set up webhook:
   - Endpoint: `https://yourdomain.com/api/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret to `.env.local`

### ✅ 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Testing Authentication

### Create Test Account
1. Go to `/auth/signup`
2. Fill in form (watch password strength meter!)
3. If email confirmation is enabled, check your email
4. Sign in at `/auth/login`

### Troubleshooting Login Issues

**Problem**: "Invalid login credentials"
- **Solution**: Verify email/password, or create new account

**Problem**: "Email not confirmed"
- **Solution**: 
  - Check your email for confirmation link
  - OR disable email confirmation in Supabase Dashboard

**Problem**: Can't see users in Supabase
- **Solution**: Go to Supabase Dashboard → Authentication → Users to verify account exists

## Testing Payments (Stripe Test Mode)

1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any 3-digit CVC
4. Any ZIP code

## Next Steps

- Create your first location
- Set up a template
- Run your first inspection
- Invite team members

## Need Help?

Check the main README.md for more details on features and architecture.
