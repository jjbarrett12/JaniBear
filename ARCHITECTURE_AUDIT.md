# Architecture Audit: Multi-Tenant CRM + LiDAR Capture (Supabase + Next.js)

**Date:** 2025-02-10  
**Goal:** Confirm whether the implementation is on the correct path for multi-tenant CRM + mobile LiDAR capture with Supabase + Next.js, object storage for LiDAR assets, and async pipeline for derived assets.

---

## 1. Repo Summary: Key Components (Paths + Evidence)

### Supabase migrations / SQL / RLS

- **Migrations:** `supabase/migrations/` — 001 through 022 (plus duplicate 021 variants). Core: `001_initial_schema.sql`, `002_rls_policies.sql`, `010_foundation_update.sql`, `019_multi_org_modules_tiers.sql`, `020_cleanup_handoff_lidar_permissions.sql`.
- **RLS:** `002_rls_policies.sql` enables RLS on initial tables and uses `is_org_member(org_id, auth.uid())` (two-arg). `010_foundation_update.sql` replaces with one-arg `is_org_member(org_id)` using `auth.uid()` inside the function (lines 283–291). Later migrations (008, 014, 015, 019) add RLS for new tables via `org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())` or `is_org_member(org_id, auth.uid())`.
- **Org membership:** `org_members` links `user_id` to `org_id`; `001_initial_schema.sql` (lines 22–28), extended in 012, 016, 019 (role_enum, capabilities, org_type checks).

### Supabase client creation (browser vs server)

- **Browser:** `src/lib/supabase/client.ts` — `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
- **Server:** `src/lib/supabase/server.ts` — `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies })`.
- **Evidence:** No `SUPABASE_SERVICE_ROLE_KEY` or `service_role` in `src/`. Edge functions use service role via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` only in `supabase/functions/` (server-side Deno).

### Scan tables / models / types

- **Table:** `walkthrough_scans` in `supabase/migrations/019_multi_org_modules_tiers.sql` (lines 225–236):
  - `id`, `org_id`, `walkthrough_id`, `created_by`, `status TEXT NOT NULL DEFAULT 'uploaded'`, `device_model`, `roomplan_raw_path`, `preview_images JSONB`, `extracted JSONB`, `created_at`.
- **Documentation:** `LIDAR_SCAN_DATA_MODEL.md` and `WALKTHROUGH_CAMERA_LIDAR_IMPLEMENTATION.md` describe path convention and lifecycle; no CHECK on `status` in DB (only comment in 020: "uploaded | processing | ready | failed").
- **Types:** No dedicated TypeScript type/interface for `walkthrough_scans` in repo; app code does not yet insert/update this table.

### Storage upload code paths

- **Existing uploads:**  
  - `src/components/settings/branding-settings.tsx` — `organization-logos` bucket, path `{orgId}/{filename}` (org-scoped).  
  - `src/components/admin/employee-form.tsx` — `employee-photos`.  
  - `src/components/inspections/inspection-runner.tsx` — `inspection-photos`.  
  - `src/components/contracts/contract-upload-form.tsx` — contract upload (bucket not shown in grep; likely inspection or similar).
- **LiDAR/scans:** No app code that uploads to a `walkthrough-scans` bucket or writes `walkthrough_scans` rows. `LIDAR_SCAN_DATA_MODEL.md` describes the intended flow only.

### Job / queue / worker / edge functions

- **Edge functions (stubs only):**  
  - `supabase/functions/process-sequences/index.ts` — sequence enrollments / email steps; does not touch scans.  
  - `supabase/functions/generate-reports/index.ts` — client reports; does not touch scans.  
- **No** queue, worker, or Edge Function that: picks up `walkthrough_scans` with `status = 'uploaded'`, generates derived assets (thumbnail/preview/decimated mesh), or updates `extracted` / status to `ready` or `failed`.

### Env var usage (Supabase keys)

- **App (Next.js):** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.local.example` lines 5–6; `client.ts`, `server.ts`, `middleware.ts`).
- **Edge functions:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (set in Supabase project, not in Next.js env).
- **Evidence:** No service role key in front-end or Next.js server routes.

---

## 2. Checklist: Pass/Fail + Evidence

### A) Multi-tenancy model (orgs/teams + org_membership linking users to orgs)

**PASS**

- `organizations` and `org_members` exist; `org_members` has `org_id`, `user_id`, unique `(org_id, user_id)`.
- Evidence: `001_initial_schema.sql` (lines 5–28), `012_onboarding_rls_fix.sql` (org_members with status).

### B) Every tenant-owned table has org_id and RLS with auth.uid() + membership

**PASS** (with one nuance)

- Tenant tables have `org_id` and RLS using `is_org_member(org_id)` or `org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())`.
- Child tables without `org_id` (e.g. `order_items`, `conversation_messages`) are gated via parent (orders, conversations) with org checks.
- Nuance: `is_org_member` was redefined in 010 to a single-arg version; 008/014/015 call `is_org_member(org_id, auth.uid())` — the second arg is effectively ignored but policies still enforce membership.
- Evidence: 002 (locations, crews, inspections, etc.); 010 (clients, walkthroughs, etc.); 019 (walkthrough_scans, orders, etc.).

### C) Client uses anon key only; service role never in browser

**PASS**

- Browser client: `client.ts` uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
- Server: `server.ts` uses same anon key.
- Grep for `SERVICE_ROLE` / `service_role` in `src/`: no matches.
- Evidence: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`.

### D) Supabase Storage for LiDAR/raw scans; Postgres only metadata + storage keys

**PARTIAL**

- **Postgres:** `walkthrough_scans` stores metadata and `roomplan_raw_path` (storage key); no raw bytes in DB. **Pass.**
- **Storage:** No bucket or policies for LiDAR/scans in migrations. Docs (`LIDAR_SCAN_DATA_MODEL.md`, 020 comment) say path `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/` but there is no `walkthrough-scans` (or similar) bucket or storage RLS. **Fail** for “Supabase Storage is used for LiDAR” — not yet implemented.

### E) Storage paths include org_id and rules prevent cross-tenant access

**FAIL**

- **inspection-photos** (`003_create_storage_bucket.sql`): No `org_id` in path; policies are `bucket_id = 'inspection-photos'` for authenticated (and public read). Any authenticated user can read/upload any inspection photo. **Cross-tenant risk.**
- **organization-logos**, **sds-sheets**, **employee-photos** (005, 007): First path segment restricted to `(storage.foldername(name))[1] IN (SELECT org_id::text FROM org_members WHERE user_id = auth.uid())`. **Pass** for those buckets.
- **LiDAR bucket:** Does not exist (see D). **Fail.**

### F) Explicit scan lifecycle/status (created/uploaded/queued/processing/complete/failed)

**FAIL**

- `walkthrough_scans.status` is `TEXT NOT NULL DEFAULT 'uploaded'` with no CHECK constraint. Migration 020 only adds a comment: “Recommended: uploaded | processing | ready | failed”.
- No enum or constraint; “created/queued” not distinguished in schema. **Fail** for explicit, enforced lifecycle.

### G) Async processing (queue/worker/edge) for derived assets and status updates

**FAIL**

- No Edge Function or job that: selects scans by status, generates thumbnail/preview/decimated mesh, writes to storage, or updates `walkthrough_scans.extracted` and `status` to `ready`/`failed`.
- `process-sequences` and `generate-reports` are stubs and do not touch scans.
- Evidence: `supabase/functions/process-sequences/index.ts`, `generate-reports/index.ts`; no other workers or triggers for scans.

### H) Large uploads: retry/resume or idempotent ingestion + checksum

**FAIL**

- No code path for LiDAR/RoomPlan uploads. Existing uploads (logos, inspection photos, employee photos) use simple `.upload()` with no resume, multipart, or checksum logic documented or implemented for large files.
- Evidence: `branding-settings.tsx` (single `upload` call); no resumable/chunked or checksum handling in repo.

### I) Next.js server routes/actions: no heavy processing inline; delegate to background

**FAIL**

- `/api/extract-scope` and `/api/transcribe` call `extractScope(transcript.text)` and `transcribeAudio(audio_storage_path)` inside the request. `src/lib/ai/index.ts` shows these are stubs (no real Whisper/LLM yet), but the **pattern** is synchronous: when replaced with real AI, heavy work will run inline in the route.
- Evidence: `src/app/api/extract-scope/route.ts` (line 28: `await extractScope(...)`), `src/app/api/transcribe/route.ts` (line 30: `await transcribeAudio(...)`).

### J) Spatial support (PostGIS + geometry + indexes) or clear deferral

**FAIL (deferral not documented)**

- No PostGIS extension, no geometry/geography columns, no spatial indexes in migrations. No `ARCHITECTURE.md` or `LIDAR_SCAN_DATA_MODEL.md` note that spatial is deferred and where it would live.
- Evidence: grep for `postgis`, `geometry`, `geography`: no matches.

---

## 3. What’s Missing (and Minimal Implementation)

| Gap | Where | Minimal change |
|-----|--------|----------------|
| LiDAR storage bucket + RLS | Supabase Storage | New migration: create bucket `walkthrough-scans` (or `lidar-scans`), policies so path prefix is `org_id/walkthrough_id/scans/` and `(storage.foldername(name))[1]` (and optionally [2],[3]) restricted to org membership. |
| Scan status enum/constraint | DB | New migration: `ALTER TABLE walkthrough_scans ADD CONSTRAINT walkthrough_scans_status_check CHECK (status IN ('created','uploaded','queued','processing','ready','failed'));` (or align to your exact states). |
| Async scan processor | Edge Function or worker | New Edge Function (e.g. `process-scan`) invoked by DB webhook or cron: select rows with `status = 'uploaded'`, set `processing`, download from `roomplan_raw_path`, generate preview/thumbnail (and optional mesh), upload derived objects, update `extracted` and `status = 'ready'` / `failed`. |
| Inspection-photos cross-tenant | Storage RLS | New migration: drop broad inspection-photos policies; add policies that require path prefix = `org_id/` and restrict with `(storage.foldername(name))[1] IN (SELECT org_id::text FROM org_members WHERE user_id = auth.uid())`. Enforce path convention in app (upload under `{org_id}/...`). |
| Heavy AI in routes | API routes | Move real `extractScope`/`transcribeAudio` to a job: e.g. route enqueues (insert into `job_queue` or trigger Edge Function with body), worker/Edge Function runs AI and writes results. Routes return 202 and poll or use realtime for completion. |
| Spatial / PostGIS | Docs + optional migration | Add a short “Spatial (PostGIS)” subsection to `LIDAR_SCAN_DATA_MODEL.md` or `ARCHITECTURE.md`: “Spatial deferred; when needed, add PostGIS, geometry column on [e.g. walkthrough_scans or sites], and GIST index.” Optionally one migration that does `CREATE EXTENSION IF NOT EXISTS postgis;` and adds a nullable geometry column and index. |

---

## 4. Top 5 Highest-Risk Gaps (Smallest Concrete Fix)

1. **Inspection-photos storage: no org isolation (cross-tenant read/write)**  
   - **Fix:** Add a migration that replaces `003`-style policies with path-based RLS: require first path segment = `org_id` and `(storage.foldername(name))[1] IN (SELECT org_id::text FROM org_members WHERE user_id = auth.uid())` for INSERT/SELECT/DELETE. Update all inspection-photos upload call sites to use path `{org_id}/{rest of path}` (e.g. `src/components/inspections/inspection-runner.tsx`).

2. **No LiDAR bucket or storage policies**  
   - **Fix:** Add migration (e.g. `023_walkthrough_scans_bucket.sql`): create bucket `walkthrough-scans`, then storage policies so INSERT/SELECT/DELETE only when `(storage.foldername(name))[1]` equals an `org_id` for which `auth.uid()` is in `org_members`. Document path convention `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/...` in the migration comment and in `LIDAR_SCAN_DATA_MODEL.md`.

3. **Scan status not enforced (invalid values, no lifecycle)**  
   - **Fix:** In a new migration, add `ALTER TABLE walkthrough_scans ADD CONSTRAINT walkthrough_scans_status_check CHECK (status IN ('uploaded','processing','ready','failed'));` (add `created`/`queued` if you want those). Optionally set default to `'uploaded'` if that’s the first state after insert.

4. **No async pipeline for derived assets**  
   - **Fix:** Add Edge Function `process-scan` (or use Supabase pg_net / cron): on schedule or trigger, select `walkthrough_scans` where `status = 'uploaded'`, update to `processing`, fetch file from storage, run minimal derivation (e.g. thumbnail or placeholder), write to storage and update `preview_images`/`extracted`, set `status = 'ready'` or `'failed'`. Keeps route handlers light and sets the pattern for real mesh processing later.

5. **Heavy AI work inline in API routes**  
   - **Fix:** In `src/app/api/extract-scope/route.ts` and `src/app/api/transcribe/route.ts`: have the route insert a “job” row (e.g. `scope_extraction_jobs` or `transcription_jobs` with `walkthrough_id`, `status = 'queued'`) and return 202 with job id. Add a small worker (Edge Function or separate process) that polls or is triggered by DB, calls `extractScope`/`transcribeAudio`, and updates DB. Alternatively trigger an Edge Function from the route and return 202; Edge Function does the work and updates DB. No change to AI stubs required for the pattern.

---

## 5. Next 3 Commits (Titles + Changes)

1. **fix(storage): scope inspection-photos by org_id and add RLS**  
   - New migration: alter storage policies for `inspection-photos` so INSERT/SELECT/DELETE require first path segment = org_id and membership check.  
   - Update `src/components/inspections/inspection-runner.tsx` (and any other inspection-photos upload) to use path `{org_id}/...` (and ensure org_id is available in context).

2. **feat(lidar): add walkthrough-scans bucket and enforce scan status**  
   - New migration: create bucket `walkthrough-scans` with RLS requiring path prefix by org and membership.  
   - Second migration (or same file): add `walkthrough_scans_status_check` CHECK constraint for `uploaded`/`processing`/`ready`/`failed` (and optional `created`/`queued`).  
   - Optionally: one-line note in `LIDAR_SCAN_DATA_MODEL.md` that bucket and status enum are now enforced.

3. **feat(scan): Edge Function stub process-scan and defer heavy AI to jobs**  
   - Add `supabase/functions/process-scan/index.ts`: read `walkthrough_scans` with `status = 'uploaded'`, set `processing`, placeholder “process” (e.g. set `extracted = '{}'`, `status = 'ready'`), or call external pipeline; update row.  
   - In `extract-scope` and `transcribe` routes: document or implement “enqueue job, return 202” and point to worker/Edge Function that will run `extractScope`/`transcribeAudio` and write results (can be a follow-up commit that replaces stub with real enqueue + worker).

---

**Verdict:** The repo is **on the right path** for multi-tenant CRM (org model, RLS, anon-only client) and has the right **data shape** for LiDAR (metadata in Postgres, paths documented). It **is not yet** correct for “LiDAR in object storage + async derived assets”: storage for scans is missing, status lifecycle is not enforced, there is no processing pipeline, and heavy work is still inline in routes. Addressing the five gaps above and the “next 3 commits” will align the implementation with the stated architecture.
