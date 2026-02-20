# JANIBEAR AI Integration Guide

This guide explains how to integrate and test AI across the platform using the infrastructure already in place, while respecting **joint-employer rules** (franchisors see outcomes only; labor/staffing AI is operator-only and suggestion-based).

---

## 1. What You Already Have

### 1.1 Two AI Entry Points (to unify)

| Path | Used By | Config Source |
|------|---------|----------------|
| **Org-level** | `getAIService(orgId)` | `ai_config` table (per org, feature `'general'`) |
| **Env-level** | `process.env.OPENAI_API_KEY` | `.env.local` |

**Current usage:**

- **Org-level (`openai-service.ts`):** SDS analysis, compliance suggestions, PO recommendations, invoice notes, phone call analysis, **proposal suggestions** (crew size, hours, sqft/hr).
- **Env-level (direct OpenAI):** **Scan schedule** (extract locations/days from document text), **Split crews** (assign locations to N crews with optimization). Both use `requireOperatorOrg()`.

**Recommendation:** Use **one pattern** for production: org-level `ai_config` with an **env fallback** when `ai_config` has no key (so dev/single-tenant can use `OPENAI_API_KEY`). That way operators can bring their own key later if desired.

### 1.2 Database

- **`ai_config`** (migration `007_ai_admin_features.sql`): `org_id`, `feature` (e.g. `'compliance'`, `'sds'`, `'po'`, `'invoicing'`, `'phone'`, `'general'`), `enabled`, `provider`, `model`, `api_key_encrypted`, `settings`, `usage_count`, `last_used_at`.  
- **Constraint:** `feature` is currently restricted to the list above; add `'proposal'`, `'schedule'`, `'staffing'`, `'supply'` (or a single `'general'`) as needed.

### 1.3 Existing AI Capabilities

| Capability | API / Module | Notes |
|------------|--------------|--------|
| SDS analysis | `POST /api/ai/analyze-sds` | PDF text → hazards, storage, disposal, emergency |
| Compliance suggestions | `POST /api/ai/compliance-suggestions` | Type/description → action items |
| PO recommendations | `POST /api/ai/po-recommendations` | Location + recent orders + inventory → items/suppliers |
| Invoice notes | `POST /api/ai/invoice-notes` | Customer + items + total → professional notes |
| **Proposal (bid) suggestions** | `OpenAIService.suggestProposal()` | Sqft, flooring, frequency, restrooms → crew size, hours, labor estimate |
| **Schedule extraction** | `POST /api/ai/scan-schedule` | **Operator-only.** Document text → locations, days, sqft, frequency (JSON) |
| **Crew splitting** | `POST /api/ai/split-crews` | **Operator-only.** Locations + numCrews → assignments per crew |
| Scope from transcript | `POST /api/extract-scope` | **Stub only.** Walkthrough transcript → `scope_models` (needs real LLM) |
| Phone call analysis | `OpenAIService.analyzePhoneCall()` | Transcript → summary, sentiment, action items |

### 1.4 LiDAR / Proposals (from PROP_LIDAR_SOFTWARE_SYSTEM.md)

- **Proprietary core:** `processScan`, surface pipeline, **scope merge** (LiDAR + vision + transcript → `scope_models`), **bid derivation** (scope → line items).
- **extract-scope:** Today it uses `extractScope()` in `src/lib/ai/index.ts`, which is a **stub**. Wiring this to the same LLM as scan-schedule (or openai-service) is the next step so walk-through transcripts become structured scope and feed proposals.

---

## 2. Mapping Your Goals to the Stack

| Your goal | Existing piece | What to add / do |
|-----------|----------------|------------------|
| **Sales flow** | Marketing automation, workflows, contract renewals | AI: draft follow-up emails, suggest next steps, summarize deal state (use `getAIService` + prompts). |
| **Appointments with LiDAR** | LiDAR blueprint, walkthrough_scans, extract-scope | Ensure scan processor and scope merge run after upload; use **extract-scope** with real LLM; link to calendar/scheduling (optional). |
| **Proposals** | `suggestProposal()` (crew/hours), `generateProposal()` stub, scope_models | Wire **generateProposal** to LLM (scope_json + pricing rules → HTML + pricing_json). Add “draft from scope” in UI. |
| **Customer pain points from walk-through** | Walkthrough transcripts, extract-scope | New: **extract pain points** from transcript (e.g. “concerns”, “priorities”, “must-fix”) → store on walkthrough or opportunity. Same LLM pattern as extract-scope. |
| **Follow-up (emails/calls)** | Marketing sequences, workflow engine, phone_calls | AI: suggest email copy, suggest call talking points, suggest task titles from last interaction. Use sequences + workflows; add “AI draft” actions. |
| **Service schedule → task lists per employee** | **scan-schedule** (text), **split-crews** (locations → crews) | Add **photo/PDF input** (OCR or existing scan-schedule text); then **split by employee** (same as split-crews but output per-employee task lists for “tonight”). Operator-only. |
| **Hire/fire suggestions** | — | **New, operator-only.** Suggestions based on outcomes (coverage, quality, turnover) only. Wording: “Suggested staffing review” / “Consider reviewing headcount” — never “fire X”. Never visible to franchisors. |
| **Equipment buy suggestions** | **po-recommendations** | Extend with “equipment” context (e.g. floor type, sqft, current equipment) and optional equipment catalog. |
| **When to order supplies / how much** | **po-recommendations**, inventory (if any) | New: **supply reorder suggestions** (usage patterns, min levels, lead time) → “suggested order date” and “suggested quantity”. Operator-only or org-level. |
| **Inspections, KPIs, management feedback** | Inspections, dashboards, compliance | AI: **outcomes only** — trends, risk signals, quality patterns. No labor control; no individual performance. Franchisors see aggregated outcome insights only. |

---

## 3. Joint-Employer Compliance (mandatory)

From **JANIBEAR_OS_SYSTEM.md** and workspace rules:

- **Franchisors:** May define standards and review **outcomes** only. No labor control, no worker PII, no real-time execution.
- **Operators:** Control labor, crews, schedules, execution.

**AI rules:**

- **Franchisor-visible AI:** Analyze **patterns, trends, risk signals, quality outcomes** only. No staffing, discipline, or individual worker performance.
- **Operator-only AI:** Labor scheduling, task lists, **hire/fire suggestions**, equipment/supply ordering, crew splitting. All such endpoints must use **requireOperatorOrg()** and be hidden from franchisor UX.
- **Wording:** Use “Suggested”, “Consider”, “Recommended” — never “Required”, “Must”, “Assign”, “Discipline”, “Fire”.

So: **Sales, proposals, pain points, follow-up drafts, inspections/KPIs (outcomes)** can be org-wide. **Schedule→task lists, crew split, staffing suggestions, supply reorder** must be **operator-only** and suggestion-only.

---

## 4. How to Integrate and Test Effectively

### 4.1 Single place for “is AI available?” (implemented)

**Done.** `getAIService(orgId)` in `src/lib/ai/openai-service.ts` now:

1. Tries org-level **ai_config** (feature `'general'`, `enabled = true`, `api_key_encrypted` set).
2. If none, falls back to **process.env.OPENAI_API_KEY** and returns an `OpenAIService` instance.

All AI routes (scan-schedule, split-crews, extract-scope, compliance, SDS, PO, invoice, pain-points, staffing-suggestions) use this, so one key (env or org) controls “AI on” for testing.

### 4.2 Enable AI for your org (testing)

**Option A – Env only (simplest for first tests)**  
- Set in `.env.local`: `OPENAI_API_KEY=sk-...`  
- Ensure scan-schedule and split-crews already use this.  
- For routes that only use `getAIService(orgId)`, add the fallback in 4.1 so they use the env key when `ai_config` is empty.

**Option B – Org-level (per-org keys)**  
- Run migration so `ai_config` exists and RLS allows your org to manage it.  
- **Finish the AI Settings page** (`/app/admin/ai-settings`): form to set API key (store in `ai_config.api_key_encrypted` for org, feature `'general'`), enable/disable, optional model.  
- Then “AI on” = org has a row in `ai_config` with `enabled = true` and a key.

### 4.3 Test flow (recommended order)

1. **Unify client**  
   - Implement env fallback in `getAIService` (or a new `getAIServiceOrEnv(orgId)`).  
   - Optionally refactor scan-schedule and split-crews to use the same helper so one key (env or org) drives all.

2. **Proposals and scope**  
   - **Done:** **extractScope** in `src/lib/ai/index.ts` now calls `getAIService(orgId)` and `extractScopeFromTranscript()` when orgId is provided; `POST /api/extract-scope` passes org id.  
   - **Done:** **Pain points** — `OpenAIService.extractPainPoints()` and `POST /api/ai/pain-points` (body: `{ transcript }`) return `{ pain_points, summary }`. Wire this into walkthrough/opportunity UI to store concerns.

3. **Schedule → task lists**  
   - **Photo/proposal input:** If input is image/PDF, add an OCR step (or use existing document text from proposals); then re-use the same extraction schema as scan-schedule.  
   - **Per-employee split:** Reuse split-crews logic but output **per-employee** task lists for a given night (each “crew” or “employee” gets a list of tasks/locations). Operator-only API and UI.

4. **Follow-up and sales**  
   - Add “AI draft” for email/call: endpoint that takes (lead/opportunity id or last note) and returns suggested email body and/or call talking points.  
   - Wire into marketing sequences or workflow “draft email” step (human edits before send).

5. **Staffing suggestions (operator-only)**  
   - **Done:** `POST /api/ai/staffing-suggestions` (operator-only). Body: `coverage_notes`, `quality_trend`, `open_shifts_count`, `turnover_notes`, `total_locations`, `total_crew_count`. Returns `{ suggestion, focus_areas }` — outcome-based only, no names or “fire X”.

6. **Supply reorder**  
   - New endpoint, e.g. `POST /api/ai/supply-reorder-suggestions`, with usage/inventory context.  
   - Return “suggested order date” and “suggested quantities” (and optionally tie to PO recommendations).

7. **Inspections / KPIs**  
   - Use existing inspection and KPI data; add an “outcomes insight” endpoint that asks the LLM for **trends and risk signals** only (no labor, no individuals).  
   - Franchisor views get only aggregated outcome summaries.

### 4.4 Feature flags

- **Existing:** `features` table and plan tiers (Cub, Grizzly, Kodiak).  
- **AI:** Either gate by existing plan or add an `ai_assistant` (or per-capability) feature.  
- **ai_config.feature** can stay as a single `'general'` or be split later (e.g. `'proposal'`, `'schedule'`, `'staffing'`) for per-feature toggles and usage.

---

## 5. Quick Reference: Files and Endpoints

| Item | Path |
|------|------|
| AI service (org key) | `src/lib/ai/openai-service.ts` |
| AI stubs (scope, proposal) | `src/lib/ai/index.ts` |
| Extract scope API | `src/app/api/extract-scope/route.ts` |
| Scan schedule API | `src/app/api/ai/scan-schedule/route.ts` |
| Split crews API | `src/app/api/ai/split-crews/route.ts` |
| Pain points (transcript → concerns) | `src/app/api/ai/pain-points/route.ts` |
| Staffing suggestions (operator-only) | `src/app/api/ai/staffing-suggestions/route.ts` |
| SDS, compliance, PO, invoice, etc. | `src/app/api/ai/*` |
| AI Settings page (to complete) | `src/app/admin/ai-settings/page.tsx` |
| ai_config schema | `supabase/migrations/007_ai_admin_features.sql` |
| LiDAR / scope merge | `src/lib/prop/`, PROP_LIDAR_SOFTWARE_SYSTEM.md |
| API guards | `src/lib/api-guard.ts` (requireOperatorOrg, requireApiOrg) |

---

## 6. Summary

- You already have **two AI paths** (org `ai_config` and env `OPENAI_API_KEY`). Unify with an **env fallback** and use one client everywhere.
- **Proposals, scope, pain points, follow-up drafts, and outcome-only insights** fit the current stack; **schedule→task lists, staffing suggestions, and supply reorder** are natural extensions, with **operator-only** and **suggestion-only** for anything labor-related.
- **Franchisors** only get outcome/pattern AI; **operators** get full AI including scheduling and suggested staffing/supply actions.
- To start testing: add env fallback, wire **extractScope** to a real LLM, then iterate on pain points, proposal generation, and per-employee task lists, then add staffing and supply suggestions and outcome-only insights for management.

This keeps you within the infrastructure already lined out and makes AI integration testable step by step while staying compliant with JANIBEAR OS joint-employer rules.
