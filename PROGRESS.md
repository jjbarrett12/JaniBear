# Janibear Development Progress

## ✅ Completed Features

### 1. Project Setup
- ✅ Next.js 14+ with App Router and TypeScript
- ✅ TailwindCSS + shadcn/ui components
- ✅ Supabase client setup (browser + server)
- ✅ Middleware for auth session management
- ✅ Logo integration across app

### 2. Database Schema
- ✅ Complete schema with all tables (organizations, profiles, locations, crews, templates, inspections, issues, bids, contracts, etc.)
- ✅ Row Level Security (RLS) policies for all tables
- ✅ Helper functions for org membership checks
- ✅ Indexes for performance

### 3. Authentication & Onboarding
- ✅ Login page with email/password and magic link
- ✅ Organization onboarding flow
- ✅ Profile creation
- ✅ Auth middleware protection

### 4. Locations
- ✅ CRUD operations for locations
- ✅ Location detail pages
- ✅ Square footage tracking
- ✅ Address management

### 5. Crews
- ✅ Crew management (create, edit, view)
- ✅ Crew member assignment
- ✅ Crew-to-location assignments
- ✅ Language preference support (English/Spanish)

### 6. Templates
- ✅ Template builder with drag-and-drop sections
- ✅ Multiple item types (pass/fail, rating, numeric, text, yes/no, task checklist)
- ✅ Section and item reordering
- ✅ Weight and required flags
- ✅ Instructions per item

### Marketing & Homepage (current)
- ✅ Dark theme homepage (zinc-950, orange accents)
- ✅ AI-driven sales copy (walkthrough → proposal, janitorial sales teams)
- ✅ Operations add-on section
- ✅ Book a Demo / Early Access page (`/demo`)
- ✅ Orange primary buttons, white text, transparent logo treatment
- ✅ Logo larger in nav, hero, footer; app sidebar; auth/onboarding
- ✅ Logo `unoptimized` for PNG transparency

## 🚧 In Progress / Next Steps

### 7. Scheduling
- [ ] Create schedules (one-time + weekly recurrence)
- [ ] Assign templates to locations
- [ ] Assign crews/inspectors
- [ ] Generate upcoming occurrences (next 14 days)
- [ ] Task assignment per crew member

### 8. Inspections
- [ ] Start inspection from schedule or ad-hoc
- [ ] Multi-section form with progress indicator
- [ ] Photo upload to Supabase Storage
- [ ] Incremental save (per section)
- [ ] Auto-scoring calculation
- [ ] Geo-location capture (optional)

### 9. Task Management
- [ ] Individual task assignments from schedules
- [ ] Crew member task list view
- [ ] Real-time task completion tracking
- [ ] Photo attachments per task

### 10. Issues
- [ ] Create issues from failed inspection items
- [ ] Issue status workflow (open → in_progress → resolved)
- [ ] Assignee and due date management
- [ ] Comments and attachments
- [ ] Issue detail page

### 11. Bids & Estimates
- [ ] Square footage measurement/input
- [ ] Business type selection
- [ ] Flooring types input
- [ ] Restroom/stall/sink counts
- [ ] Days per week and hourly rate
- [ ] Supply/chemical usage cost calculation
- [ ] Fair market value generation

### 12. Contracts
- [ ] Upload service contracts (PDFs)
- [ ] Assign contracts to locations
- [ ] Contract management

### 13. Dashboards
- [ ] Org dashboard (inspections, scores, issues)
- [ ] Location dashboard
- [ ] Charts and trends

### 14. Reports
- [ ] Inspection report view
- [ ] Printable format
- [ ] Token-based sharing
- [ ] Public report route (/r/[token])

## 📝 Notes

- All RLS policies are in place for security
- Mobile-first design approach
- Multi-language support ready (language_preference field)
- Storage bucket setup needed: `inspection-photos`
