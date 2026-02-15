# Janibear - Janitorial Quality Management & Sales AI SaaS

A comprehensive, multi-tenant SaaS for janitorial businesses, featuring AI-powered proposals, walkthroughs, quality control, and operations management.

## 🚀 Key Modules

### 1. Sales & AI Proposals
- **Walkthroughs**: Mobile-friendly capture (text, photo, video, audio)
- **AI Extraction**: Auto-generates scope of work from walkthrough data (stubbed)
- **Proposals**: Create, edit, and send professional proposals with e-sign/approval
- **CRM**: Manage Clients, Sites, Leads, and Opportunities
- **Public Proposal Links**: Client-facing view for acceptance

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

**Production:** Set `NEXT_PUBLIC_APP_URL` to your single canonical URL (e.g. `https://janibear.com`). The app will redirect all traffic (including www vs non-www) to that host so auth and cookies stay consistent. Ensure your hosting/DNS serves both www and non-www to this app so the redirect can run.

### 2. Database Migrations

Run the SQL migrations in Supabase SQL Editor in order:
1. `supabase/migrations/001_initial_schema.sql` (and 002-009 if not already run)
2. **`supabase/migrations/010_foundation_update.sql`** (Critical: Adds new SaaS foundation tables)

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
