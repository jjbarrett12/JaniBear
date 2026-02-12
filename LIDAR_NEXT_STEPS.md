# What’s Next to Get LiDAR Going

Prioritized list. Do **1–3** first so you have a real capture → upload → DB flow; then add processing and UX.

---

## 1. Run backend migrations (if not already)

Ensure the scan bucket and scan status constraint exist:

```bash
# From repo root, with Supabase CLI linked to your project
supabase db push
```

Or run manually in Supabase SQL Editor:

- **025_walkthrough_scans_bucket_and_status.sql** — creates `walkthrough-scans` bucket, RLS, and `walkthrough_scans.status` check.
- **027_scope_surface_audit_fields.sql** — adds `scope_models.surface_type_final`, `surface_source`, etc.

Without these, the app’s upload and any scope merge will fail or be incomplete.

---

## 2. Implement real RoomPlan in the iOS native module (main blocker)

**Current state:** `apps/janibear-scan/ios/JaniBearScan/RoomPlanCaptureModule.swift` is a **stub**. It writes a placeholder file and returns paths so the upload queue can be tested, but it does not use the device LiDAR or RoomPlan.

**What you need:** Replace the stub with a flow that:

1. Presents Apple’s RoomPlan UI (`RoomCaptureView` / `RoomCaptureSession`, iOS 16+).
2. When the user finishes the scan, export the result to `.usdz`.
3. Save the file under `Documents/Scans/<scanId>/roomplan.usdz`.
4. Optionally capture 1–3 preview images (e.g. ARKit snapshot) and save as `preview_0.jpg`, `preview_1.jpg` in the same folder.
5. Resolve the React Native promise with `{ scanId, roomplanPath, previewPaths, deviceModel }`.

**Requirements:**

- **Mac with Xcode** (iOS Simulator does not have LiDAR; use a real iPhone/iPad with LiDAR).
- **Xcode:** Add **ARKit** capability; set minimum iOS to **16** (or 17 if you use newer RoomPlan APIs).
- **Info.plist:** `NSCameraUsageDescription` (e.g. “JaniBear Scan uses the camera to capture LiDAR room scans for walkthroughs.”).
- **Device:** RoomPlan requires a LiDAR-capable device (e.g. iPhone 12 Pro+, iPad Pro with LiDAR).

A step-by-step Swift implementation and a view-controller wrapper are in **`apps/janibear-scan/ios/JaniBearScan/LIDAR_IOS_IMPLEMENTATION.md`** (created below). Use that to implement the native module without changing the RN bridge contract.

---

## 3. Verify end-to-end: capture → upload → DB

1. **Run the app on a LiDAR device** (or keep the stub and a real `.usdz` in Documents for upload testing).
2. Sign in, pick a walkthrough, tap **Start scan**.
3. After capture (or stub), confirm:
   - A row appears in `walkthrough_scans` (Supabase Table Editor).
   - Files appear in Storage bucket `walkthrough-scans` under `org/<org_id>/walkthroughs/<walkthrough_id>/scans/<scan_id>/roomplan.usdz` (and optional `preview_0.jpg`).
   - Row is updated with `roomplan_raw_path` and `preview_images`.
4. If upload fails, check RLS (user must be in the same org as the walkthrough) and env (SUPABASE_URL, SUPABASE_ANON_KEY).

---

## 4. Add a “processing” trigger (optional but recommended)

When a scan is uploaded (row has `roomplan_raw_path` set and `status = 'uploaded'`), run your proprietary pipeline and write `extracted`:

- **Option A — Edge Function:** Supabase Edge Function triggered by Storage upload (e.g. on `walkthrough-scans` object created) or by a DB webhook on `walkthrough_scans` insert/update. The function downloads the file, calls `processScan` (from `src/lib/prop` or equivalent), and updates the row with `extracted` and `status = 'ready'`.
- **Option B — API route:** Next.js API route (e.g. `POST /api/process-scan`) that your app or a cron job calls with `scan_id`. The route uses the Supabase service role to read the row and storage path, runs `processScan`, and updates the row.

Start with a **stub** implementation of `processScan` that writes a minimal `extracted` (e.g. one room, 0 sqft) so the rest of the pipeline (scope merge, proposals) can be wired without real geometry yet.

---

## 5. Surface confirmation UX in the app (after capture works)

Once a scan has rooms/areas (from stub or real processing), add the “We detected: Carpet” flow in the scan app:

- After a room is captured (or when the user taps a room), show a **bottom sheet** with:
  - Room name and area (e.g. “Office 102 · 342 sq ft”).
  - High confidence: “We detected: Carpet” + **Confirm** / **Change Surface Type**.
  - Low confidence: “What surface is this?” + Carpet / Tile / LVT / Wood / Concrete / Other.
- Use copy from **`apps/janibear-scan/src/lib/surfaceCopy.ts`** and **`LIDAR_SURFACE_UX.md`**.
- Send `user_surface_tag` (and room/zone id if you have it) to the backend; backend updates `extracted` or scope and runs scope merge so `surface_type_final` and `surface_source` stay correct.

---

## 6. Scope merge and proposals (web)

- When you have at least stub `extracted` (and optionally `user_surface_tag`), call **`computeMergedScope`** (from `src/lib/prop`) in an API route or Edge Function and upsert into `scope_models` (including `surface_type_final`, `surface_source`).
- Wire **extract-scope** (or a new “merge scope from scan” endpoint) so proposals and dashboards use the merged scope and show sqft by surface type.

---

## Summary order

| # | Step | Blocker? |
|---|------|----------|
| 1 | Run migrations 025 + 027 | No — do first |
| 2 | **Implement real RoomPlan in Swift** | **Yes — need Mac + LiDAR device** |
| 3 | Verify capture → upload → DB | No — after 2 |
| 4 | Processing trigger (stub then real) | No |
| 5 | Surface confirmation UX (bottom sheet) | No |
| 6 | Scope merge + proposals | No |

If you’re on **Windows only**, you can still run the app in the Android emulator (no LiDAR; app shows “LiDAR only on iOS”) and work on the **backend** (migrations, processing trigger, scope merge). The **native RoomPlan implementation must be done on a Mac** (or via cloud Mac / CI with Xcode).
