# Janibear - Janitorial Quality Management & Sales AI SaaS

A comprehensive, multi-tenant SaaS for janitorial businesses, featuring AI-powered proposals, walkthroughs, quality control, and operations management.

## 🚀 Key Modules

### 1. Sales & AI Proposals (“Deal Machine”)
- **Leads** (`/app/sales/leads`): Table + right-drawer quick view; Convert to Opportunity (existing or new Account) → Pipeline
- **Pipeline** (`/app/sales/pipeline`): Board/Table by stage; opportunity drawer with walkthrough/scope/proposal actions
- **Accounts** (`/app/sales/accounts`): Saved views (Prospects/Customers); account detail tabs: Overview, Walkthroughs, Scope, Proposals, Activity
- **Walkthroughs** (`/app/sales/walkthroughs`): Table/Calendar; “Create Scope from Walkthrough” → Scope Builder
- **Scope Builder** (`/app/sales/scope-builder` → `/app/sales/scope`): Split view; Generate Proposal; Lock/Unlock
- **Proposals** (`/app/sales/proposals`): Table (account, amount, status); accepted → “Open Contract Launch”
- **Win/Loss** (`/app/sales/win-loss`): KPI strip + closed-opportunities table
- **Contract Launch** (`/app/sales/contract-launch` → `/app/sales/launch-packets`): 3-column (Deal summary, Checklist, Ops preview); Submit to Ops → redirect to Launch Intake with item highlighted
- **Operations → Launch Intake** (`/app/ops/launch-intake`): Incoming launches list (missing-item badges); detail: Accept Intake / Request Changes
- **Backward compatibility**: `/app/sales/launch-packet` and `/app/sales/scope-builder` redirect to the canonical routes; nav label “Contract Launch” (UI) vs “Launch Packet” (route) preserved

### 2. QC & Retention
- **Inspections**: Customizable templates, scoring, and mobile execution
- **Issues**: Issue tracking, SLAs, and work order generation
- **Client Reports**: Monthly automated reports (PDF/HTML)

### 3. Operations
- **Workload**: Employee management and workload balancing
- **Scheduling**: Recurring inspection and task schedules

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **AI Integration**: Stubs ready for OpenAI/Whisper integration
- **Validation**: Zod + React Hook Form

## 🔧 Setup Instructions

### 1. Environment Setup

Create `.env.local` (see `.env.local.example` for all options):

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Production:** Set `NEXT_PUBLIC_APP_URL` to your live URL (e.g. `https://janibear.com`). To avoid redirect loops, do not redirect www↔non-www in app code; use your host (e.g. Vercel domain settings) to make one canonical and redirect the other.

### 2. Database Migrations

The app needs all migrations applied so tables like `accounts` and `facilities` exist. If you see **"Could not find the table 'public.accounts' in the schema cache"** when saving a new account, your database is missing these migrations.

**Option A – Supabase CLI (recommended)**  
From the project root, link your project (if not already), then push all migrations:

```bash
npx supabase link   # use your project ref and database password
npx supabase db push
```

**Option B – SQL Editor**  
In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**, run the migration files in **numeric order** from `supabase/migrations/`:

1. `001_initial_schema.sql` through `009_*.sql` (if not already run)
2. **`010_foundation_update.sql`** (critical: organizations, org_members, etc.)
3. Continue through **`037_accounts_facilities.sql`** (creates `accounts` and `facilities`)
4. Then **`041_account_users_and_limits.sql`** (account invites and user limits)

Run each file’s full contents once, in order; skip any that you’ve already applied.

### 3. Storage Setup

Create the following public buckets in Supabase Storage:
- `walkthrough-media`
- `inspection-photos`
- `proposal-pdfs` (optional)

Ensure policies allow authenticated uploads and public reads (or signed URLs).

### 4. Run Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3001`. Changes here affect only your machine.

### 5. Update janibear.com (deploy to production)

Local (`npm run dev`) and the live site (janibear.com) use the same codebase, but the live site only updates when you deploy:

```bash
npm run deploy
```

This script stages all changes, commits (if any), and pushes to `main`. Vercel builds and deploys to https://janibear.com in 1–2 minutes. Use this when you’re ready for your local changes to go live.

**Verify Sales → Ops handoff (smoke check):**  
1) Open every Sales nav item (Leads, Pipeline, Accounts, Walkthroughs, Scope Builder, Proposals, Win/Loss, Contract Launch).  
2) Create a lead → Convert to Opportunity (select or create account) → confirm it appears in Pipeline.  
3) From Contract Launch, open a packet (or create one from account/opportunity flow if available) → complete checklist → Submit to Operations → confirm redirect to `/app/ops/launch-intake` and the new launch is highlighted.  
4) In Launch Intake, open the launch → Accept Intake or Request Changes.

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/            # Login, Signup
│   ├── (app)/             # Protected App Routes (Dashboard, CRM, etc.)
│   │   ├── dashboard/
│   │   ├── crm/
│   │   ├── walkthroughs/
│   │   ├── proposals/
│   │   └── qc/
│   ├── api/               # API Routes & Webhooks
│   └── page.tsx           # Landing Page
├── components/            # UI Components (shadcn)
├── lib/
│   ├── supabase/          # Client/Server helpers
│   ├── ai/                # AI Service Stubs
│   ├── permissions.ts     # Role-based access control
│   └── auth.ts            # Auth utilities
└── actions/               # Server Actions
```

## 🔐 Permissions & Roles

Defined in `src/lib/permissions.ts`.
Roles: `owner`, `admin`, `sales`, `ops`, `inspector`, `cleaner`, `client`.

## 🤖 AI Features (Stubs)

Located in `src/lib/ai/`. Connect your providers (OpenAI, Anthropic) here:
- `transcribeAudio(path)`
- `extractScope(text)`
- `generateProposal(scope)`

## 📅 Scheduled Jobs

For Follow-up Sequences and Monthly Reports, use Supabase Edge Functions invoked by pg_cron or an external scheduler (e.g., Vercel Cron).
(Stubs provided in database schema for `sequences` and `report_runs`).

## 🛒 Member Pro Gear

Member-only shop for equipment and gloves with negotiated pricing. Gated by org-level feature flag.

**Enable Pro Gear for an organization**

1. In Supabase SQL Editor (or any client), run:
   ```sql
   UPDATE organizations
   SET pro_gear_enabled = true
   WHERE id = 'your-org-uuid';
   ```
2. Replace `your-org-uuid` with the organization’s `id` (from `organizations` table).
3. Users in that org will see “Member Pro Gear” in the Executive nav and can access `/app/pro-gear`.

When `pro_gear_enabled` is `false` (default), the nav link is hidden and direct visits to Pro Gear show a message to contact the admin.
