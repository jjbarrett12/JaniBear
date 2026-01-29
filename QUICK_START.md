# Janibear Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Set Up Supabase (if not done yet)

1. Go to https://supabase.com and create a new project
2. In your Supabase project:
   - Go to **SQL Editor**
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_rls_policies.sql`
   - Go to **Storage** → Create bucket named `inspection-photos` (set to public for MVP)
   - Go to **Settings** → **API** → Copy your URL and anon key

### Step 2: Configure Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Open the App

Navigate to http://localhost:3000

### Step 5: First Time Setup

1. **Sign Up**: Create an account with email
2. **Create Organization**: Complete onboarding
3. **Add Location**: Create your first building/account
4. **Create Template**: Build your first inspection form
5. **Start Inspecting!**: Create a schedule and run an inspection

## 🎯 What's Built

✅ Complete multi-tenant SaaS platform
✅ Authentication & organization management
✅ Location & crew management
✅ Template builder with multiple question types
✅ Scheduling system (one-time + weekly)
✅ Full inspection runner with photos & scoring
✅ Task assignments for crew members
✅ Issue tracking from failed items
✅ Bid calculator for estimates
✅ Contract upload & management
✅ Report sharing with token links
✅ Mobile-first responsive design

## 📱 Mobile Ready

The app is built mobile-first and works great on:
- Phones (iOS & Android)
- Tablets
- Desktop browsers

## 🔒 Security

- Row Level Security (RLS) on all tables
- Multi-tenant data isolation
- Token-based report sharing
- Role-based access control

## 🐛 Troubleshooting

**Can't connect to Supabase?**
- Check your `.env.local` file has correct credentials
- Verify your Supabase project is active

**Storage upload fails?**
- Make sure `inspection-photos` bucket exists
- Check bucket permissions (public for MVP)

**Database errors?**
- Verify migrations ran successfully
- Check RLS policies are enabled

## 📚 Next Steps

- Read `SETUP.md` for detailed setup instructions
- Check `README.md` for feature documentation
- Review `PROGRESS.md` for development status

Happy inspecting! 🐻
