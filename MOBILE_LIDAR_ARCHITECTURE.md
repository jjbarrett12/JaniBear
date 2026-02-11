# Mobile LiDAR Capture — Architecture (Deliverables 1–4)

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

## Summary (items 1–4)

1. **Architecture:** React Native shell + native iOS (Swift) module for LiDAR; fastest path to production while keeping auth, org, and upload logic in one stack and reusing Supabase.
2. **Data flow:** Capture in native → local files → metadata + queue in RN → when online: insert row → upload files → update row with paths; failures and retries at insert/upload/update; one `scan_id` per capture for idempotency.
3. **Files:** One `.usdz` and 1–3 `.jpg` previews per scan; all uploaded to `walkthrough-scans` under `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/`; local copies can be removed after upload.
4. **Supabase:** Anon key + user session only; Storage uploads and `walkthrough_scans` insert/update via RLS; add a migration for the `walkthrough-scans` bucket and org-scoped storage policies before shipping.

Items 5 (offline-first strategy), 6 (minimal v1 scope), and 7 (implementation plan) can be written next when you’re ready.
