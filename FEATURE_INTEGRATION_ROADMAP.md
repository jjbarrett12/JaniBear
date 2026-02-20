# JaniBear Feature Integration Roadmap

This document describes the 7 major features added to JaniBear inspired by the best capabilities of Zoho, HubSpot, and Salesforce — purpose-built for janitorial operations.

---

## What Was Built

### Migration `046_feature_integration_framework.sql`

All new database tables, indexes, RLS policies, and feature registration in a single idempotent migration. Run via `supabase db push` or apply directly.

### Architecture Summary

```
New Files Created:
─────────────────────────────────────────────────────────────
TYPES
  src/types/features.ts              — All type definitions

SERVICE MODULES (src/lib/)
  recurring-billing.ts               — Invoice generation, AR aging, payment reminders
  work-orders.ts                     — CRUD, auto-creation from inspections/tickets, SLA tracking
  marketing-automation.ts            — Email sequences, enrollments, step processing
  customer-surveys.ts                — CSAT/NPS surveys, token-based responses, scorecard
  route-optimization.ts              — Route planning, nearest-neighbor optimization, GPS check-in
  workflow-engine.ts                 — Trigger/action engine, condition evaluation, execution logs
  contract-renewals.ts               — Renewal pipeline, 90/60/30-day reminders

API ROUTES (src/app/api/)
  recurring-billing/route.ts         — GET (list/stats), POST (create)
  work-orders/route.ts               — GET (list/stats), POST (create)
  work-orders/[id]/route.ts          — GET (detail), PATCH (status)
  marketing/sequences/route.ts       — GET (list), POST (create)
  marketing/sequences/[id]/route.ts  — GET (detail/stats)
  marketing/sequences/[id]/enroll/   — POST (enroll contact)
  marketing/templates/route.ts       — GET (list), POST (create)
  surveys/route.ts                   — GET (list/scorecard), POST (create)
  surveys/[id]/send/route.ts         — POST (send to email or accounts)
  public/survey/[token]/route.ts     — GET/POST (public, no-auth survey)
  routes/route.ts                    — GET (list), POST (create)
  routes/[id]/optimize/route.ts      — POST (run optimization)
  check-in/route.ts                  — POST (GPS check-in/out)
  workflows/route.ts                 — GET (list), POST (create)
  workflows/[id]/route.ts            — GET (detail/logs)
  contract-renewals/route.ts         — GET (list/pipeline), POST (create)
  contract-renewals/[id]/route.ts    — PATCH (update status)

CRON ENDPOINTS (src/app/api/cron/)
  recurring-billing/route.ts         — Daily: generate invoices from due schedules
  payment-reminders/route.ts         — Every 4h: send pending payment reminders
  sequence-processor/route.ts        — Every 15-30min: process due email sequence steps
  contract-renewals/route.ts         — Daily: send 90/60/30-day renewal notifications
```

---

## Feature Details

### 1. Recurring Billing & Payment Automation

**Inspired by:** Zoho Books, Stripe Billing

**What it does:**
- Define billing schedules per account/facility (weekly, biweekly, monthly, quarterly, annually)
- Auto-generate invoices on schedule via cron
- Schedule payment reminders at -3d, due, +3d, +7d, +14d, +30d
- AR aging dashboard (Current, 1-30, 31-60, 61-90, 90+ days)
- Optional Stripe subscription linking

**Tables:** `recurring_billing_schedules`, `payment_reminders`

**API:** `GET/POST /api/recurring-billing` | `GET /api/recurring-billing?view=stats`

**Cron:** `/api/cron/recurring-billing` (daily), `/api/cron/payment-reminders` (every 4h)

**To finish (UI):**
- [ ] Billing schedules list page at `/app/billing`
- [ ] Create/edit billing schedule form
- [ ] AR aging dashboard widget on Financial Health page
- [ ] Payment reminder settings per account
- [ ] Connect Stripe autopay (ACH/card)

---

### 2. Work Order Management

**Inspired by:** Salesforce Field Service Lightning

**What it does:**
- Full work order lifecycle: pending → assigned → in_progress → completed
- Auto-create from failed inspections or service tickets
- Priority levels (low/medium/high/urgent) with SLA deadlines
- Checklist items, before/during/after photos
- Time tracking (estimated vs actual duration)

**Tables:** `work_orders` (enhanced), `work_order_items`, `work_order_photos`

**API:** `GET/POST /api/work-orders` | `GET/PATCH /api/work-orders/[id]`

**To finish (UI):**
- [ ] Work orders list page at `/app/work-orders`
- [ ] Work order detail page at `/app/work-orders/[id]`
- [ ] Create work order form (manual + from inspection/ticket)
- [ ] Mobile-friendly work order execution view
- [ ] SLA countdown badge on overdue work orders
- [ ] Dashboard widget: open work orders + SLA compliance

---

### 3. Marketing Automation & Email Sequences

**Inspired by:** HubSpot Sequences, HubSpot Marketing Hub

**What it does:**
- Create multi-step email sequences (drip campaigns)
- Steps: email, SMS, task, wait, condition
- Trigger types: manual, new lead, proposal sent, lost deal, etc.
- Template library with variable interpolation ({{first_name}}, etc.)
- Enrollment tracking with open/click/reply rates
- Auto-advance through steps via cron

**Tables:** `email_templates`, `email_sequences`, `email_sequence_steps`, `email_sequence_enrollments`, `email_sequence_events`

**API:** `GET/POST /api/marketing/sequences` | `POST /api/marketing/sequences/[id]/enroll` | `GET/POST /api/marketing/templates`

**Cron:** `/api/cron/sequence-processor` (every 15-30 min)

**To finish (UI):**
- [ ] Marketing hub page at `/app/marketing`
- [ ] Sequence builder (drag-and-drop steps)
- [ ] Template editor with rich text + variables
- [ ] Enrollment list per sequence with status
- [ ] Sequence analytics dashboard (open rate, click rate, reply rate)
- [ ] "Enroll in sequence" button on lead detail page
- [ ] Connect real email provider (Resend/SendGrid) in `src/lib/email/index.ts`

---

### 4. Customer Satisfaction Surveys (CSAT/NPS)

**Inspired by:** Zoho Survey, HubSpot Service Hub, Salesforce Surveys

**What it does:**
- Create CSAT, NPS, or custom surveys with multiple question types
- Send via email with unique token links (no login required for respondents)
- Bulk send to all billing contacts
- Auto-trigger after inspections, monthly, or on ticket resolve
- NPS scorecard: promoters/passives/detractors breakdown
- Score tracking by account over time
- Alert when satisfaction drops

**Tables:** `customer_surveys`, `survey_questions`, `survey_responses`, `survey_answers`

**API:** `GET/POST /api/surveys` | `POST /api/surveys/[id]/send` | Public: `GET/POST /api/public/survey/[token]`

**To finish (UI):**
- [ ] Surveys list page at `/app/surveys`
- [ ] Survey builder (questions, types, order)
- [ ] Public survey page at `/survey/[token]` (branded, mobile-friendly)
- [ ] Scorecard dashboard (NPS gauge, CSAT trend, by-account breakdown)
- [ ] "Send survey" button on account detail page
- [ ] Auto-trigger configuration (after inspection, monthly, etc.)
- [ ] Alert rule: notify when account score < threshold

---

### 5. Route Optimization & GPS Check-In/Out

**Inspired by:** Salesforce Field Service, Zoho FSM

**What it does:**
- Create route plans with ordered facility stops
- Nearest-neighbor route optimization (plug in external API for production)
- GPS check-in/out at facilities with geofence validation
- Time-on-site reporting per facility/crew member
- Before/after photo capture at check-in
- Route status tracking (draft → optimized → active → completed)

**Tables:** `route_plans`, `route_stops`, `crew_check_ins`

**API:** `GET/POST /api/routes` | `POST /api/routes/[id]/optimize` | `POST /api/check-in`

**To finish (UI):**
- [ ] Routes page at `/app/routes` with map visualization
- [ ] Route builder: select facilities, drag to reorder, optimize
- [ ] Mobile check-in/out interface (GPS + photo)
- [ ] Time-on-site report page
- [ ] Geofence visualization on map
- [ ] Integrate Google Directions API or OSRM for real drive times
- [ ] Real-time crew location view (requires WebSocket or polling)

---

### 6. Workflow Automation Engine

**Inspired by:** Zoho Blueprint, Salesforce Flow, HubSpot Workflows

**What it does:**
- Define "when X happens, do Y" automation rules
- 16 trigger types (inspection completed, invoice overdue, ticket created, etc.)
- 13 action types (send email, create work order, assign user, notify, etc.)
- Condition evaluation with comparison operators
- Execution logging with error tracking
- Called automatically by other services via `fireEvent()`

**Tables:** `automation_workflows`, `automation_triggers`, `automation_actions`, `automation_logs`

**API:** `GET/POST /api/workflows` | `GET /api/workflows/[id]?view=logs`

**To finish (UI):**
- [ ] Workflows page at `/app/workflows`
- [ ] Visual workflow builder (trigger → condition → action chain)
- [ ] Pre-built templates ("Auto-create work order on failed inspection", etc.)
- [ ] Execution log viewer with debug info
- [ ] Wire `fireEvent()` calls into existing services:
  - Inspection completion → `fireEvent('inspection_completed', ...)`
  - Ticket creation → `fireEvent('ticket_created', ...)`
  - Invoice overdue status change → `fireEvent('invoice_overdue', ...)`

---

### 7. Contract Renewal Tracking

**Inspired by:** Salesforce CPQ, HubSpot Deal Renewals

**What it does:**
- Track contract expiration dates per account
- Auto-notify at 90, 60, and 30 days before expiration
- Renewal pipeline: upcoming → notified → proposal_sent → renewed/lost
- Pipeline summary: MRR at risk, renewal rate YTD
- Auto-email clients at 30-day mark
- Auto-mark expired contracts

**Tables:** `contract_renewals`

**API:** `GET/POST /api/contract-renewals` | `GET /api/contract-renewals?view=pipeline` | `PATCH /api/contract-renewals/[id]`

**Cron:** `/api/cron/contract-renewals` (daily)

**To finish (UI):**
- [ ] Renewals page at `/app/contract-renewals`
- [ ] Renewal pipeline board (kanban view)
- [ ] "Create renewal" from account detail page
- [ ] Dashboard widget: expiring contracts + MRR at risk

---

## Feature Gating

All 8 new features are registered in the `features` table:

| Feature Code | Available On |
|---|---|
| `recurring_billing` | Cub, Grizzly, Kodiak |
| `work_orders` | Cub, Grizzly, Kodiak |
| `marketing_automation` | Grizzly, Kodiak |
| `customer_surveys` | Grizzly, Kodiak |
| `route_optimization` | Grizzly, Kodiak |
| `workflow_engine` | Grizzly, Kodiak |
| `contract_renewals` | Grizzly, Kodiak |
| `customer_portal` | Grizzly, Kodiak |

To check feature access in code:

```typescript
// Server-side (API routes)
import { requireApiOrg } from '@/lib/api-guard';
// (Feature check can use the entitlements system)

// Client-side
import { FEATURE_CODES } from '@/types/features';
// Check via org entitlements
```

---

## Cron Schedule (Recommended)

| Endpoint | Frequency | Purpose |
|---|---|---|
| `/api/cron/recurring-billing` | Daily at 6 AM | Generate invoices |
| `/api/cron/payment-reminders` | Every 4 hours | Send due reminders |
| `/api/cron/sequence-processor` | Every 15 min | Process email steps |
| `/api/cron/contract-renewals` | Daily at 7 AM | Send renewal alerts |
| `/api/cron/missed-task-notifications` | Every 30 min | (existing) Task alerts |
| `/api/cron/sales-pulse-daily` | Daily at 8 AM | (existing) Sales email |

All crons are secured with `CRON_SECRET` environment variable.

---

## Implementation Priority

### Phase 1 — Core (Weeks 1-3)
1. **Recurring Billing** — finish Stripe integration, build billing page
2. **Work Orders** — build list/detail pages, wire to inspections/tickets
3. **Contract Renewals** — build renewal page, wire cron to Vercel

### Phase 2 — Growth (Weeks 4-6)
4. **Marketing Automation** — connect email provider, build sequence builder
5. **Customer Surveys** — build survey page + public survey form

### Phase 3 — Advanced (Weeks 7-10)
6. **Route Optimization** — integrate mapping API, build route planner
7. **Workflow Engine** — build visual builder, wire fireEvent into services

### Phase 4 — Polish
8. **Customer Portal** — enhanced client-facing views
9. **QuickBooks Integration** — finish OAuth flow
10. **Predictive Churn Scoring** — AI model using inspection + survey + payment data

---

## Joint-Employer Compliance Notes

Per JaniBear OS rules:
- All labor-control features (work orders, routes, crew check-in, schedules) are **operator-only**
- Franchisors can view aggregated outcome data (survey scores, renewal rates) but NOT individual worker check-ins, time-on-site, or work order assignments
- Workflow automations created by franchisors can only use "Suggested" language and opt-in adoption
- Survey results visible to franchisors show account-level scores only, not crew-level data
