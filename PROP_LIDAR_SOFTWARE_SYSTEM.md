# JANIBEAR Proprietary LiDAR Software System — Strategic Blueprint

**Goal:** Set up the LiDAR + scan + scope pipeline so it becomes **winning proprietary software**: differentiated, defensible, and revenue-driving for JANIBEAR, without coupling the rest of the platform to unproven or replaceable parts.

---

## 1. What “Winning” Means Here

| Dimension | Target |
|-----------|--------|
| **Product** | “We measure, we document, we prove” — scan → area + surface → bid/QC in one flow. Feels intelligent (“We detected: Carpet”) and premium. |
| **Technical** | Proprietary value lives in **clear, swappable modules**. Commodity (RoomPlan, Supabase, CRUD) stays separate so you can upgrade or replace either side. |
| **Business** | Scan + surface data drives **line items, pricing, and proof-of-performance**. That creates stickiness and upsell (LiDAR add-on, higher tiers). |
| **Legal / RBAC** | Stays within JANIBEAR_OS: franchisors see outcomes/standards only; operators control capture and execution. No labor control by franchisors. |

---

## 2. Commodity vs Proprietary (Where to Invest)

### Commodity (buy / standardize, don’t own)

- **Capture:** Apple RoomPlan/ARKit → `.usdz` + preview images. Standard APIs.
- **Auth, DB, Storage:** Supabase (auth, Postgres, RLS, `walkthrough-scans` bucket). Same as rest of JANIBEAR.
- **App shell:** React Native + native bridge for LiDAR. Lists, walkthrough picker, upload queue.
- **CRM / pipeline:** Existing opportunities, walkthroughs, sites. No change.

### Proprietary (your IP and differentiator)

- **Geometry processing:** Raw scan (e.g. `.usdz` / mesh) → **room polygons, floor area by room/zone, baseboards, stairs.** This is where “we measure” becomes **your** algorithm and data shape.
- **Surface intelligence:** “We detected: Carpet” — classifier + confidence + UX (assisted tagging, then Tier 2/3). Your training data, your thresholds, your UX copy.
- **Scope merge:** Combine LiDAR (area) + vision (surface) + transcript (narrative) into **one scope_models row** and `surface_type_final` / `surface_source`. Your rules (e.g. “LiDAR sqft overrides when present”).
- **Bid/line-item generation:** Sqft by surface type → production rates, scope of work (vacuum vs mop vs scrub), QC checklists. Your pricing and category logic.
- **Proof-of-performance:** “12,400 sqft tile scrubbed weekly” — derived from scan + surface + schedule. Your reporting and positioning.

So: **proprietary = processing + surface logic + scope merge + bid/QC derivation.** Everything else can stay commodity.

---

## 3. Recommended Architecture: Clean Boundaries

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MOBILE (commodity + your UX)                                            │
│  RN app → RoomPlan native module → .usdz + preview_N.jpg → upload queue   │
│  Surface UX: "We detected: Carpet" / "What surface is this?" (your copy)  │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STORAGE + METADATA (commodity)                                         │
│  walkthrough-scans bucket, walkthrough_scans row, status, paths          │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PROPRIETARY CORE (your IP)                                             │
│  • Scan processor: .usdz/mesh → rooms[], floor_area, room_polygon        │
│  • Surface pipeline: frames → surface_prediction, confidence             │
│  • Scope merge: LiDAR + vision + transcript → scope_models + surface_*   │
│  • Bid/QC: surface_type_final + sqft → line items, QC rules               │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  PRODUCT (commodity UI, your logic)                                     │
│  Proposals, dashboards, reports — read scope_models / surface_type_final  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Proprietary core** is the only place that **interprets** raw scans and **produces** structured scope and surface data. The rest of the app only consumes that output.
- Keep the core behind **clear interfaces** (e.g. “processScan(scanId) → extracted; mergeScope(walkthroughId) → scope_models”). Implementation can be swapped (stub → real algorithm, or different vendor) without changing mobile or product UI.

---

## 4. Code Layout (How to Keep It Winning)

### 4.1 Single “proprietary” surface area

- **Option A (monorepo):** Under `src/` (or `apps/janibear-scan/` for app-only), create a dedicated tree for proprietary logic, e.g.:
  - `src/lib/prop/` or `packages/janibear-prop/` (if you add a packages folder)
  - Subdirs: `scan-processor/`, `surface-pipeline/`, `scope-merge/`, `bid-derivation/` (or one module with clear namespaces).
- **Option B (separate repo):** A private repo “janibear-prop” that exposes APIs or publishable packages; Next.js and workers call it. Use when you want to strictly limit who sees algorithms or when you license this stack.

Recommendation for **speed and clarity:** start with **Option A** — e.g. `src/lib/prop/` — so one codebase stays the source of truth and refactors are easy. Move to Option B only if you need repo-level separation (e.g. licensing, different team).

### 4.2 Interfaces, not implementations

- **Scan processor:**  
  `processScan(scanId: string): Promise<ExtractedScan>`  
  - Input: scan row + paths (from DB/storage).  
  - Output: `{ rooms: [{ name, floor_area, room_polygon?, frames? }], total_sqft }` (and any other fields you define in LIDAR_SCAN_DATA_MODEL).
  - First implementation: stub that returns mock or minimal data; later: your (or a vendor’s) real .usdz/mesh parser.

- **Surface pipeline:**  
  `runSurfaceClassifier(frames: string[]): Promise<{ surface_prediction, confidence }>`  
  - Input: preview image paths (or URLs).  
  - Output: surface type + 0–1 confidence.  
  - First implementation: heuristic or “unknown” + 0; later: your model or third-party API.

- **Scope merge:**  
  `mergeScopeForWalkthrough(walkthroughId: string): Promise<void>`  
  - Reads: walkthrough_scans.extracted, walkthrough_transcripts, any existing scope_models.  
  - Writes: scope_models row (extracted_json, surface_type_final, surface_type_predicted, surface_confidence, surface_source).  
  - Your rules: e.g. “LiDAR sqft overrides when present; surface from vision or user_surface_tag.”

- **Bid derivation (optional but high value):**  
  `deriveBidLineItems(scopeModelId: string): LineItem[]`  
  - Reads scope_models (and surface_type_final).  
  - Returns line items (sqft by surface, rates).  
  - Keeps pricing and categories in your code (or config), not in generic CRUD.

### 4.3 Triggers and jobs

- **When a scan is uploaded:**  
  - Set `walkthrough_scans.status = 'processing'`.  
  - Invoke **scan processor** → write `extracted`; optionally invoke **surface pipeline** on preview frames and merge into `extracted`.  
  - Set `status = 'ready'` or `'failed'`.  
  - Optionally call **scope merge** for that walkthrough so scope_models stays in sync.

- **When user confirms surface in app:**  
  - App sends `user_surface_tag` (and room/zone id if you have it).  
  - Backend updates `extracted` or a dedicated table; then run **scope merge** again so `surface_type_final` and `surface_source` reflect “manual” or “ai_confirmed.”

- All of this can be:
  - **Supabase Edge Function** (Deno), or  
  - **Next.js API route** that enqueues a background job (e.g. Vercel background, or external worker that calls your API), or  
  - **External worker** (e.g. queue + Node/Python) that has storage + DB access.

Keep “when to run” in one place (e.g. “on scan upload” / “on surface confirm”) so you can add retries, idempotency, and observability without touching proprietary logic.

---

## 5. How This Stays a “Winning” System

- **Differentiation:** Only you combine LiDAR + “We detected: Carpet” + scope merge + bid/QC in one product. Competitors get RoomPlan too; they don’t get your pipeline and UX.
- **Lock-in:** Proposals and proof-of-performance are built from **your** scope and surface data. Switching cost is high once sales and ops rely on it.
- **Upsell:** LiDAR add-on and higher tiers (e.g. “AI surface detection”) are natural extensions of the same proprietary core.
- **Iteration:** You can improve geometry or surface models behind the same interfaces; mobile and UI don’t need to change.
- **RBAC:** Processing and scope merge run in the backend with org context; franchisors only see outcomes (e.g. “12,400 sqft tile”) and never control capture or labor. Stays within JANIBEAR_OS.

---

## 6. Next Steps (Concrete)

1. **Create the interface layer** in the repo (e.g. `src/lib/prop/`) with the four interfaces above and stub implementations that write to `extracted` and `scope_models` in the shapes already defined (LIDAR_SCAN_DATA_MODEL, migration 027).
2. **Wire triggers:** “On walkthrough_scans insert/update (status uploaded)” → call scan processor (and optionally surface pipeline) → update row; then call scope merge for that walkthrough.
3. **Implement one real piece at a time:** e.g. first a real RoomPlan → rooms + sqft (or a vendor that returns that shape), then surface classifier, then refine scope merge rules.
4. **Keep UX and copy in one place:** LIDAR_SURFACE_UX.md + `surfaceCopy.ts` in the scan app so “We detected” and “What surface is this?” stay consistent and premium.

This blueprint is the setup. The “winning” part is executing on the proprietary core and keeping the boundaries clean so you can replace or license pieces without rewriting the rest of JANIBEAR.

---

## 7. Code and related docs

- **`src/lib/prop/`** — Interface layer and stub implementations: `processScan`, `runSurfaceClassifier`, `computeMergedScope`, `deriveBidLineItems`. Replace stubs with real logic; keep consuming code on these exports.
- **LIDAR_AND_SURFACE_STRATEGY.md** — What LiDAR is for (geometry/area) vs vision (surface); tiers.
- **LIDAR_SURFACE_UX.md** — Microcopy and flows (“We detected: Carpet”, bottom sheet, operator chip).
- **LIDAR_SCAN_DATA_MODEL.md** — Storage paths, walkthrough_scans, extracted shape.
- **MOBILE_LIDAR_ARCHITECTURE.md** — RN + native module, upload flow.
- **JANIBEAR_OS_SYSTEM.md** — Franchisor/operator rules; no labor control by franchisors.
