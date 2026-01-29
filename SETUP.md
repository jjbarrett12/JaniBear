# Janibear Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor and run the migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_rls_policies.sql`
   - Create a storage bucket named `inspection-photos`:
     - Go to Storage in Supabase dashboard
     - Create new bucket: `inspection-photos`
     - Set it to public (or configure RLS policies for authenticated access)
   - Get your Supabase URL and anon key from Settings > API

3. **Environment variables:**
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Navigate to http://localhost:3000

## First Steps

1. **Sign up/Login:**
   - Go to `/auth/login`
   - Sign up with email (magic link or password)
   - Complete onboarding to create your organization

2. **Create your first location:**
   - Navigate to Locations
   - Click "New Location"
   - Fill in building/account details

3. **Create a template:**
   - Go to Templates
   - Click "New Template"
   - Add sections and items for your inspection form

4. **Set up a schedule:**
   - Go to Schedules
   - Create a schedule linking a location and template
   - Set recurrence (one-time or weekly)

5. **Start an inspection:**
   - Go to Inspections > Start Inspection
   - Select location and template
   - Complete the form section by section
   - Add photos and notes as needed
   - Complete to calculate scores

## Key Features

### Crew Management
- Create crews and assign members
- Assign crews to locations
- Each crew member can have language preference (English/Spanish)

### Task Assignments
- When a schedule is created with a crew, tasks can be assigned to individual members
- Crew members see only their assigned tasks in "My Tasks"
- Tasks can be checked off as completed

### Bids & Estimates
- Calculate fair market value for cleaning bids
- Input square footage, restrooms, flooring types
- Automatic calculation of labor, supplies, and chemical costs

### Issues
- Create issues from failed inspection items
- Track status (open → in_progress → resolved)
- Add comments and photos
- Assign to team members

### Reports
- View completed inspections
- Share reports via token-based links
- Public links expire after 30 days (configurable)

## Storage Setup

The app uses Supabase Storage for:
- Inspection photos
- Service contracts
- Team member avatars (future)

Ensure the `inspection-photos` bucket is configured with appropriate RLS policies or set to public for MVP.

## Deployment

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy

## Notes

- All data is scoped by organization (multi-tenant)
- RLS policies ensure users can only access their org's data
- Mobile-first design for field use
- Offline mode not included in MVP (online only)
