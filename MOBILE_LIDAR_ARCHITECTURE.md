# Mobile LiDAR Capture — Architecture (Deliverables 1–7)

Senior mobile scope: iOS LiDAR (RoomPlan/ARKit), offline-first, Supabase integration.  
Backend processing is assumed to exist or be built separately. No service-role keys on device.

---

## 1. Architecture decision

**Recommendation: React Native shell + native iOS module (Swift) for LiDAR.**

### Why not full native Swift only

- **Speed to production:** You already have a web app and likely want one codebase for auth, org context, walkthrough list, and settings. A thin React Native shell reuses Supabase JS client, auth flow, and API patterns. LiDAR is the only part that must be native.
- **Team / hiring:** React Native is easier to staff for the non-LiDAR surface (lists, forms, sync status). One app binary for future Android (non-LiDAR) is possible without maintaining two full-native codebases.
- **Risk:** Full Swift is lower risk for LiDAR itself but pushes all UI, auth, and sync into Swift; that’s more work and duplicates logic that already exists in the web/Next.js side.

### Why not Expo managed

- **RoomPlan/ARKit:** Requires native modules and direct access to ARKit/RoomPlan APIs. Expo’s managed workflow does not support RoomPlan out of the box; you’d need a custom dev client and eject from “managed” in practice.
- **Large uploads / background:** You need fine control over file I/O, background URLSession, and possibly a native upload queue. Unmanaged/native module gives that without fighting the managed stack.
- **Locked constraint:** Your platform decision explicitly disallows Expo managed unless justified; for LiDAR + offline uploads there is no strong justification.

### Why React Native + native module wins for this product

| Concern | RN + native module | Full Swift |
|--------|---------------------|------------|
| LiDAR capture | Native Swift module (RoomPlan/ARKit); no compromise | Native; ideal |
| Offline queue / retry | Can do in JS with SQLite (e.g. watermelondb) or in Swift; both viable | Native only |
| Supabase (auth, DB, Storage) | Reuse `@supabase/supabase-js` with anon key + session | Need Swift client; more code |
| Walkthrough list / org context | Same Supabase queries as web; one mental model | Duplicate in Swift |
| Time to first working flow | Faster: shell + one native screen + bridge | Slower: entire app in Swift |
| Future Android (no LiDAR) | One RN app; LiDAR screen iOS-only or no-op on Android | Second codebase |

**Conclusion:** Use a React Native app with a native iOS module that exposes “start capture,” “export to temp files,” and “get file paths.” The RN side owns: auth (Supabase anon + session), walkthrough selection, upload queue, and writing `walkthrough_scans` rows. The native side owns: RoomPlan session, export to `.usdz` (and optionally preview images), and returning paths to the RN layer. No scan processing on device beyond capture and basic validation (e.g. file exists, size within limit).

**When to revisit full Swift:** If the RN bridge or JS upload queue becomes a bottleneck, or if the product becomes iOS-only and LiDAR-centric, a full Swift app is a clean alternative. For “get LiDAR into production fast” with a multi-tenant Supabase backend, RN + native module is the better tradeoff.

---

## 2. Mobile data flow

End-to-end lifecycle with failure and retry points.

### 2.1 High-level sequence

```
[User] → Pick org + walkthrough (RN) → Start scan (RN → Native) → Capture (Native)
  → Export to local files (Native) → Hand off paths (Native → RN)
  → Persist to local queue (RN) → [When online] Upload files + upsert DB (RN)
  → Backend picks up row (status = 'uploaded') → Processing (out of scope)
```

### 2.2 Step-by-step

**a) User starts scan**

- RN: User is authenticated; current org and selected `walkthrough_id` (and thus `org_id`) are known.
- RN: Optionally check network; if offline, show “Scan will upload when back online.”
- RN calls native module: `startCapture(walkthroughId: String, orgId: String)` (or equivalent). Native launches RoomPlan/ARKit UI.

**b) Scan captured (RoomPlan / ARKit)**

- Native: RoomPlan session runs; user scans rooms and finishes.
- Native: Export to RoomPlan’s canonical format (e.g. `.usdz`). No mesh processing or sqft calculation on device.
- **Failure point:** Export can fail (e.g. low memory, user cancelled). Native returns an error code; RN shows “Scan failed, try again” and does not create a queue entry.

**c) Files saved locally**

- Native: Write `.usdz` to app container (e.g. `Documents/Scans/<temp_id>/roomplan.usdz`).
- Native: Optionally generate 1–3 preview images (e.g. from ARKit snapshot or first frame) and write to same folder as `preview_0.jpg`, `preview_1.jpg`.
- Native returns to RN: list of local file paths (and optionally sizes). RN does not move or read file bytes; it only stores paths and metadata for the upload job.

**d) Metadata prepared**

- RN: Generate a new UUID for the scan (`scan_id`).
- RN: Build metadata: `scan_id`, `org_id`, `walkthrough_id`, `created_by` (auth.uid()), `device_model`, `status: 'pending_upload'` (or keep as `'uploaded'` only after successful upload—see below).
- **Idempotency:** The scan row is created only after we have local files. We use one row per capture; `scan_id` is the client-generated UUID so we never duplicate a row for the same capture.

**e) Upload when online**

- RN: Persist a “pending scan” job to local DB (SQLite/Realm): `scan_id`, `org_id`, `walkthrough_id`, local file paths, metadata, `created_at`.
- When network is available (and app is foreground or background upload is configured):
  1. **Insert row first:** Insert into `walkthrough_scans` with `roomplan_raw_path: null`, `preview_images: []`, `status: 'uploaded'`. If insert fails (e.g. RLS, invalid FK), mark job as failed and do not upload files.
  2. **Upload files:** For the scan folder, upload `roomplan.usdz` and each `preview_N.jpg` to Supabase Storage under the path convention (see Section 3). Use the same `scan_id` in the path.
  3. **Update row:** Set `roomplan_raw_path` and `preview_images` (array of storage paths), keep `status: 'uploaded'`.
  4. **Remove from queue:** Delete or mark the local queue entry as completed; optionally delete local temp files.
- **Failure / retry:** If step 2 or 3 fails (network, 5xx, auth), keep the queue entry and retry later. Do not insert a second row for the same `scan_id`. On retry, either (A) skip insert and go straight to upload + update if the row already exists, or (B) use a “created” vs “uploaded” state so the backend only processes when `status = 'uploaded'` and paths are set.

**f) Backend processing triggered**

- Backend (assumed): Poll or listen for `walkthrough_scans` rows with `status = 'uploaded'` and non-null `roomplan_raw_path`; set `processing` then run pipeline; set `ready` or `failed` and fill `extracted`. Mobile does not trigger this explicitly; it only ensures the row and files are present.

### 2.3 Where failures and retries happen

| Step | Failure | Retry behavior |
|------|---------|-----------------|
| Capture / export | User cancel, export error | No queue entry; user can start a new scan. |
| Local write | Disk full, permission | Return error to user; no queue entry. |
| Insert row | RLS, FK, network | Retry with exponential backoff; keep job in queue. |
| Storage upload | Network, 4xx/5xx, timeout | Retry; optionally resume by re-uploading (Storage upsert). Do not create a new scan row. |
| Update row (paths) | Network, 4xx/5xx | Retry; row already exists with null paths until update succeeds. |

- **Idempotency:** One `scan_id` per capture. Insert uses that `id`; upload uses paths that include `scan_id`. Backend should treat one row + one folder as one unit; no duplicate scans for the same capture.

---

## 3. File formats and outputs

### 3.1 What the capture flow produces (on device)

| File | Format | Producer | Purpose |
|------|--------|----------|---------|
| RoomPlan export | `.usdz` | Native (RoomPlan API) | Raw scan; uploaded to Supabase. |
| Preview images | `.jpg` | Native (e.g. ARKit snapshot or camera frame) | Thumbnails for UI/backend; uploaded. |

- No on-device processing: no mesh decimation, no sqft calculation, no room labels beyond what RoomPlan provides in the export.

### 3.2 What gets uploaded vs what stays local

- **Uploaded:**  
  - `roomplan.usdz`  
  - `preview_0.jpg`, `preview_1.jpg`, … (typically 1–3).  
  All under the same scan folder in Supabase Storage.
- **Stays local (temporary):**  
  Same files in app container until upload completes; then they can be deleted to free space. No obligation to keep them after a successful upload.

### 3.3 Naming and storage path convention

- **Bucket:** `walkthrough-scans` (private; RLS by org).
- **Path pattern (must include org_id and walkthrough_id):**

  - Folder for one scan:  
    `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/`
  - RoomPlan file:  
    `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/roomplan.usdz`
  - Preview images:  
    `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/preview_0.jpg`,  
    `.../preview_1.jpg`, …

- **Example:**  
  `org/a1b2c3.../walkthroughs/w4d5e6.../scans/s7f8g9.../roomplan.usdz`  
  and  
  `.../scans/s7f8g9.../preview_0.jpg`.

- **Consistency:** The paths stored in `walkthrough_scans.roomplan_raw_path` and `walkthrough_scans.preview_images` must be exactly the paths used in Storage (bucket-relative). The app should use the same strings for upload and for the update to the row.

---

## 4. Supabase integration

### 4.1 Authentication

- **On device:** Use only the **anon key** and the **user’s session** (JWT). Same as web: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or equivalent env for the mobile app).
- **No service-role key** on the device, ever. RLS and storage policies enforce access; the anon key plus a valid session is sufficient for org-scoped insert/update and upload.

### 4.2 How uploads to Storage happen safely

- **Client:** Supabase JS (or Swift client if you later add a full Swift app) with the anon key and the logged-in user’s session.
- **Bucket:** `walkthrough-scans`, **private**.
- **RLS (storage):** Policies must restrict access by org. Recommended pattern (align with existing migrations like `023_inspection_photos_org_isolation.sql`):
  - **INSERT:** Allow only if `(storage.foldername(name))[1]` equals an `org_id` for which `auth.uid()` is in `org_members`.
  - **SELECT / DELETE:** Same condition so org members can read/delete only their org’s paths.
- **Path structure:** First path segment = `org_id`, so RLS can use `(storage.foldername(name))[1]`. No upload to a path that doesn’t start with the user’s org.

**Note:** The repo’s `ARCHITECTURE_AUDIT.md` states that the `walkthrough-scans` bucket and these storage policies do not exist yet. A new migration is required to create the bucket and the org-scoped INSERT/SELECT/DELETE policies before the mobile app can upload.

### 4.3 How walkthrough_scans rows are created/updated

- **Create:**  
  Mobile inserts one row per capture with: `id` = client-generated UUID, `org_id`, `walkthrough_id`, `created_by` = `auth.uid()`, `status` = `'uploaded'`, `device_model`, `roomplan_raw_path` = null, `preview_images` = `[]`.  
  Do this **before** or **after** uploading files; the doc in `LIDAR_SCAN_DATA_MODEL.md` suggests insert first so that path convention can use the known `scan_id`, then upload, then update.

- **Update:**  
  After successful upload of `roomplan.usdz` and preview images, update the same row: set `roomplan_raw_path` to the full bucket-relative path of `roomplan.usdz`, and `preview_images` to the array of bucket-relative paths of the preview images. Leave `status` as `'uploaded'` so the backend can pick it up.

- **RLS:** Table already has RLS in migration 019: “Members can manage walkthrough_scans for their org” via `org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())`. Mobile uses the same session; no extra work.

### 4.4 No service-role keys on device

- All access is as the logged-in user. Row and storage access are gated by RLS and storage policies. If the backend needs to do privileged operations (e.g. set `status = 'processing'`), that happens in a server/Edge Function with a service-role key, not on the device.

---

## 5. Offline-first strategy

### 5.1 Local persistence

- **Recommendation:** Use **SQLite** for the upload queue. Options:
  - **react-native-quick-sqlite** or **expo-sqlite** (if you use a custom dev client): simple, no ORM; you define one table for pending scans.
  - **WatermelonDB:** If you expect to grow into more offline entities (e.g. walkthrough list cache, sync metadata), it gives reactive queries and sync primitives; heavier for “just a queue.”
- **V1 scope:** A single table is enough: `pending_scan_uploads` with columns: `id` (UUID, the scan_id), `org_id`, `walkthrough_id`, `created_by`, `device_model`, `roomplan_local_path`, `preview_local_paths` (JSON array or comma-separated), `created_at`, `status` (`pending` | `uploading` | `completed` | `failed`), `last_error` (optional), `retry_count`.
- **No Supabase replica:** Do not mirror full walkthroughs/scans tables locally. The queue is append-only for new captures; listing “my walkthroughs” can be fetched from the API when online and optionally cached in memory for the session.

### 5.2 Upload queue

- **Producer:** After native returns local file paths, RN inserts one row into `pending_scan_uploads` with status `pending`.
- **Consumer:** A single queue processor (e.g. a module that runs when app comes to foreground or when network becomes reachable) that:
  1. Selects rows where `status = 'pending'` (or `failed` with retry_count < max), ordered by `created_at`.
  2. For each job: insert `walkthrough_scans` row (if not already present for this `id`), upload files, update row with paths, then set local status to `completed` and optionally delete local files.
- **Concurrency:** Process one scan at a time to avoid memory spikes and simplify retry logic. Optionally allow a small max concurrent upload (e.g. 2) if you add progress UI later.

### 5.3 Retry and resume behavior

- **Retry:** On insert/upload/update failure: set `status = 'failed'`, increment `retry_count`, store `last_error`. On next run, pick up `failed` jobs with `retry_count` below a cap (e.g. 5).
- **Backoff:** Wait between retries (e.g. 30s, 1m, 5m) to avoid hammering the server. Can use a simple `next_retry_at` column and skip rows until that time.
- **Resume:** Supabase Storage upload is “full file” per object; there is no built-in byte-range resume in the JS client. For very large `.usdz` files you can later consider native iOS background URLSession with resumable uploads; for v1, retry the whole file upload on failure.
- **Row already exists:** If insert fails with “duplicate key” (e.g. retry after partial success), treat as “row exists” and proceed to upload + update only. That preserves idempotency.

### 5.4 Idempotency guarantees

- **One scan_id per capture:** Generated once when the capture is handed off from native to RN. Never create a second queue entry or second `walkthrough_scans` row for the same physical capture.
- **Insert with fixed id:** Use the same `scan_id` in both the queue and `walkthrough_scans.id`. If the insert succeeds, all future retries use that row for the update.
- **Avoid duplicate scans:** Do not “retry” by inserting again. On retry, check by `id` whether the row exists (e.g. select by id); if it exists and `roomplan_raw_path` is still null, do upload + update; if it exists and paths are set, mark queue job completed (in case a previous run died after upload but before marking done).

---

## 6. Minimal v1 scope

### 6.1 Smallest shippable LiDAR feature set

- **Auth:** User can sign in (Supabase auth: email/password or OTP; same as web). Session is persisted; app works offline for capture and queue.
- **Org + walkthrough context:** When online, user can pick current org (if multiple) and select a walkthrough from a list for that org. List is fetched from Supabase; no requirement to browse walkthroughs offline for v1.
- **Capture:** One button/screen that launches the native RoomPlan flow. User completes scan; native exports `.usdz` and optionally 1–3 preview images to local paths and returns to RN.
- **Queue:** RN writes one pending job to local SQLite. When online, app uploads: insert `walkthrough_scans` row, upload files to `walkthrough-scans` bucket, update row with paths, then mark job completed.
- **Feedback:** Simple UI: “Scan saved. It will upload when you’re online.” and a list or count of “Pending uploads (N).” When upload completes, remove from pending or show “Uploaded.”
- **Device / permissions:** iOS only; request camera (and LiDAR is implied by device capability). No Android, no web LiDAR.

### 6.2 Explicitly out of scope for v1

- **No on-device processing:** No sqft, no room labels, no mesh decimation, no “preview 3D” in the app beyond what RoomPlan shows during capture.
- **No background upload while app killed:** Upload runs when app is in foreground (or possibly in background but not “terminated”). No requirement for iOS background URLSession task that survives app kill for v1.
- **No walkthrough creation from the app:** User must have created the walkthrough elsewhere (e.g. web). App only lists and selects.
- **No scan listing in app:** Optional for v1: after upload, user does not need to see “my scans” in the mobile app; they can see them on the web. If easy, show “Uploaded” state only.
- **No multi-scan workflow:** One scan per “start capture” flow. User can start again for another scan (same or different walkthrough); no wizard for “add another room to this scan” in v1.
- **No preview image requirement:** If generating preview images in native is costly or blocks ship, v1 can upload only `roomplan.usdz` and set `preview_images: []`. Backend can remain unchanged.
- **No status polling:** App does not need to poll `walkthrough_scans.status` for `processing` → `ready`. That is a future enhancement (e.g. “Your scan is being processed”).

---

## 7. Implementation plan

### 7.1 Concrete steps

**Day 1 — Backend prerequisite and RN shell**

- Add Supabase migration: create bucket `walkthrough-scans` (private), add storage policies so `(storage.foldername(name))[1]` must be an `org_id` for which `auth.uid()` is in `org_members` (INSERT, SELECT, DELETE). Align with `023_inspection_photos_org_isolation.sql` pattern.
- Optionally add CHECK constraint on `walkthrough_scans.status`: `uploaded`, `processing`, `ready`, `failed` (and `created` if you want).
- Create React Native app (e.g. `npx react-native init JaniBearScan` or similar; no Expo managed). Configure Supabase: env for URL and anon key, install `@supabase/supabase-js`, wire auth (login screen that uses `supabase.auth.signInWithPassword` or OTP).
- Add a minimal “Home” or “Walkthroughs” screen: when online, fetch walkthroughs for the user’s org (`from('walkthroughs')` with RLS) and show a list; store selected `walkthrough_id` and `org_id` in state or context.

**Day 2–3 — Native LiDAR module**

- Create iOS native module in the RN project (Swift): expose a method that launches RoomPlan (e.g. `RoomCaptureView` / `RoomCaptureSession`), runs until user finishes, then exports to `.usdz` and writes to app Documents (e.g. `Documents/Scans/<uuid>/roomplan.usdz`). Return the scan UUID and local file path(s) to RN via the bridge (promise or callback).
- Optionally: capture 1–3 ARKit snapshots or frames and save as `preview_0.jpg`, etc. in the same folder; return those paths too.
- Add capability and permissions: enable ARKit in Xcode; add `NSCameraUsageDescription` and any required AR/LiDAR usage text in Info.plist. Ensure the app runs only on LiDAR-capable devices or gracefully hides “Scan” when unsupported.
- From RN: add a “Start scan” button that calls the native module; on success, receive paths and metadata (e.g. device model from native); on failure, show an error message.

**Day 4–5 — Upload queue and Supabase**

- Implement local queue: SQLite table `pending_scan_uploads` (see Section 5). After native returns, generate `scan_id` (UUID), write queue row with local paths.
- Implement queue processor: when app is foreground and network is reachable, process one job: insert `walkthrough_scans` (id, org_id, walkthrough_id, created_by, status: 'uploaded', device_model, roomplan_raw_path: null, preview_images: []), then upload `roomplan.usdz` and previews to Storage under `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/`, then update the row with `roomplan_raw_path` and `preview_images`. On success, mark queue job completed; on failure, set failed and retry later.
- Add simple UI: “Pending uploads (N)”; when N > 0 and online, processor runs (e.g. on mount and on focus). Optionally show “Uploading…” for the current job.

**Week 1 — Polish and ship**

- Harden retry: max retries, backoff, and “row already exists” handling so duplicate inserts never create a second scan row.
- Test offline: capture scan, go offline, then come online and confirm upload and row update.
- Test RLS: use a user in org A; confirm they cannot upload to a path with org B’s id (should get policy violation).
- Document in README: how to run the app, required env vars, and that the backend (processing) is separate.

### 7.2 File / module structure (suggested)

```
apps/
  janibear-scan/                    # or mobile/
    ios/
      JaniBearScan/
        RoomPlanCapture/             # Swift: RoomPlan session, export, file write
          RoomPlanCaptureModule.swift
          RoomPlanCaptureView.swift
        ...
    src/
      lib/
        supabase.ts                  # createClient with anon key + session
        queue/
          db.ts                      # SQLite schema + open
          pendingScans.ts             # insert, list, mark completed/failed
          processor.ts                # process one job: insert row, upload, update row
      screens/
        Login.tsx
        WalkthroughList.tsx           # fetch walkthroughs, select one
        Capture.tsx                  # "Start scan" → native, then push to queue
        PendingUploads.tsx            # list/count pending
      App.tsx
    package.json
```

- Native module name (e.g. `RoomPlanCapture`) is registered in the RN bridge and called from `Capture.tsx`.

### 7.3 Native permissions and Apple requirements

- **Info.plist:** `NSCameraUsageDescription` (required for AR/camera). If you use photo library for any fallback: `NSPhotoLibraryUsageDescription`. No special LiDAR key; capability is “ARKit” and device capability.
- **Xcode:** Enable “ARKit” and “Camera” capabilities. Set minimum iOS version high enough for RoomPlan (e.g. iOS 16+ for RoomPlan APIs).
- **Device:** RoomPlan/LiDAR requires a device with a LiDAR sensor (e.g. iPad Pro, iPhone 12 Pro and later with LiDAR). At runtime, check `ARWorldTrackingConfiguration.supportsSceneReconstruction` (or equivalent) and hide or disable “Start scan” on unsupported devices.
- **App Store:** No special entitlement for LiDAR; standard App Store review. If you record or export 3D data, ensure privacy copy is clear (e.g. “Scans are uploaded to your organization’s account”).
