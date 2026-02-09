# LiDAR / Walkthrough Scan — Implementation Guide

This guide explains how to implement LiDAR (RoomPlan) capture and storage so each scan is stored in Supabase and linked to a walkthrough.

---

## 1. Prerequisites

- A **walkthrough** must exist before any scan. The walkthrough has `id`, `org_id`, and optionally `opportunity_id` and `site_id`.
- The **user** uploading must be authenticated and a member of the same `org_id` as the walkthrough (RLS enforces this).
- A **Supabase Storage bucket** for scan files (see below).

---

## 2. Storage bucket setup

1. In **Supabase Dashboard** → **Storage** → create a bucket (e.g. `walkthrough-scans`).
2. Set **Private** (recommended). The app will upload using the authenticated user’s JWT; RLS policies on the bucket should allow:
   - **INSERT:** org members can upload into paths that start with `org/{their_org_id}/`
   - **SELECT:** org members can read paths under `org/{their_org_id}/`
3. If you prefer one bucket for all app assets, use a **folder prefix** like `walkthrough-scans/` and then paths below become:  
   `walkthrough-scans/org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/...`

**Path convention (use exactly):**

| What              | Path pattern                                                                 | Example |
|-------------------|-------------------------------------------------------------------------------|---------|
| Folder for one scan | `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/`                 | `org/a1b2.../walkthroughs/w3c4.../scans/s5d6.../` |
| RoomPlan file     | `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/roomplan.usdz`   | (same folder + `roomplan.usdz`) |
| Preview image 0   | `.../scans/{scan_id}/preview_0.jpg`                                          | (same folder + `preview_0.jpg`) |
| Preview image N   | `.../scans/{scan_id}/preview_{n}.jpg`                                        | `preview_1.jpg`, `preview_2.jpg`, … |

Use **one folder per scan**; put the RoomPlan file and all preview images inside that folder.

---

## 3. Table: `walkthrough_scans`

One row **per capture**. Multiple scans per walkthrough are allowed (e.g. multiple rooms or re-captures).

| Column             | Type    | Required | Purpose |
|--------------------|---------|----------|---------|
| `id`               | UUID    | Yes (PK) | Primary key; generate before upload so you can use it in storage paths. |
| `org_id`           | UUID    | Yes      | Must equal the walkthrough’s `org_id`. |
| `walkthrough_id`   | UUID    | Yes      | Parent walkthrough. |
| `created_by`       | UUID    | No       | `auth.uid()` of the user who uploaded. |
| `status`           | TEXT    | Yes      | Use: `uploaded` → optional `processing` → `ready` or `failed`. |
| `device_model`     | TEXT    | No       | e.g. `"iPad Pro (LiDAR)"`. |
| `roomplan_raw_path`| TEXT    | No*      | Full storage path to the RoomPlan file (e.g. `.usdz`). *Required if you have a file. |
| `preview_images`   | JSONB   | No       | Array of full storage paths: `[".../preview_0.jpg", ".../preview_1.jpg"]`. |
| `extracted`        | JSONB   | No       | Filled by backend later (see section 6). |
| `created_at`       | TIMESTAMPTZ | Auto | Set by DB. |

---

## 4. Step-by-step: iOS (or client) flow

Do these in order.

### Step 4.1 — Get IDs and create the scan row

1. You have: `walkthrough_id`, `org_id` (from the walkthrough).
2. Generate a new UUID for the scan: `scan_id`.
3. Insert one row into `walkthrough_scans`:

```json
{
  "id": "<scan_id>",
  "org_id": "<walkthrough.org_id>",
  "walkthrough_id": "<walkthrough_id>",
  "created_by": "<auth.uid()>",
  "status": "uploaded",
  "device_model": "iPad Pro (LiDAR)",
  "roomplan_raw_path": null,
  "preview_images": []
}
```

Use Supabase client:

```js
const { data, error } = await supabase
  .from('walkthrough_scans')
  .insert({
    id: scanId,
    org_id: orgId,
    walkthrough_id: walkthroughId,
    created_by: userId,
    status: 'uploaded',
    device_model: 'iPad Pro (LiDAR)',
    roomplan_raw_path: null,
    preview_images: []
  })
  .select()
  .single();
```

If the insert fails (e.g. RLS or FK), fix that before uploading files.

### Step 4.2 — Build storage paths

Use the **exact** path convention:

- Base folder:  
  `org/${orgId}/walkthroughs/${walkthroughId}/scans/${scanId}/`
- RoomPlan file:  
  `org/${orgId}/walkthroughs/${walkthroughId}/scans/${scanId}/roomplan.usdz`
- Preview images:  
  `org/${orgId}/walkthroughs/${walkthroughId}/scans/${scanId}/preview_0.jpg`,  
  `.../preview_1.jpg`, etc.

### Step 4.3 — Upload files to Storage

1. Upload the RoomPlan file to the path above (e.g. `roomplan.usdz`).
2. Upload each preview image to `preview_0.jpg`, `preview_1.jpg`, … in the same folder.

Example (Supabase JS):

```js
const folder = `org/${orgId}/walkthroughs/${walkthroughId}/scans/${scanId}`;

// 1. Upload RoomPlan file (e.g. File or Blob from RoomPlan export)
await supabase.storage
  .from('walkthrough-scans')   // your bucket name
  .upload(`${folder}/roomplan.usdz`, roomPlanFile, { upsert: true });

// 2. Upload preview images
const previewPaths = [];
for (let i = 0; i < previewBlobs.length; i++) {
  const path = `${folder}/preview_${i}.jpg`;
  await supabase.storage.from('walkthrough-scans').upload(path, previewBlobs[i], { upsert: true });
  previewPaths.push(path);  // or full path if your bucket is at root
}
```

Storage paths you pass to the DB should match what you use in Storage (same bucket + path).

### Step 4.4 — Update the scan row with file paths

After all uploads succeed, set the paths on the same row:

```js
const roomplanPath = `${folder}/roomplan.usdz`;  // must match upload path

await supabase
  .from('walkthrough_scans')
  .update({
    roomplan_raw_path: roomplanPath,
    preview_images: previewPaths,
    status: 'uploaded'
  })
  .eq('id', scanId);
```

Use the **full path** that includes the bucket-relative path (e.g. if your bucket is `walkthrough-scans`, the path in the DB can be the same as in `upload()`: `org/.../scans/.../roomplan.usdz`). Be consistent everywhere.

---

## 5. Listing scans for a walkthrough

```js
const { data } = await supabase
  .from('walkthrough_scans')
  .select('*')
  .eq('walkthrough_id', walkthroughId)
  .order('created_at', { ascending: false });
```

---

## 6. Optional: backend processing and `extracted`

After the row is in `status = 'uploaded'`:

1. A backend job or Edge Function can set `status = 'processing'`.
2. Download the file from `roomplan_raw_path`, run your extraction (e.g. parse RoomPlan or run a mesh/surface pipeline).
3. Write the result into `extracted` and set `status = 'ready'` (or `failed` on error).

**Suggested shape for `extracted`:**

```json
{
  "rooms": [
    { "name": "Lobby", "sqft": 450, "surfaces": 12 },
    { "name": "Restroom", "sqft": 120, "surfaces": 8 }
  ],
  "total_sqft": 570,
  "surfaces": 20
}
```

You can add more keys (e.g. `fixtures`, `ceiling_height`) as needed. Use `extracted` for scope generation and proposal prep.

---

## 7. Checklist summary

- [ ] Storage bucket created; RLS allows org members to read/write under `org/{org_id}/...`.
- [ ] Walkthrough exists; you have `walkthrough_id` and `org_id`.
- [ ] Insert one `walkthrough_scans` row with a new `id`, then upload files into the folder for that `id`.
- [ ] Paths follow: `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/roomplan.usdz` and `.../preview_N.jpg`.
- [ ] After upload, update the row with `roomplan_raw_path` and `preview_images` (array of paths).
- [ ] Optional: backend sets `status = 'processing'`, then writes `extracted` and sets `status = 'ready'`.

---

## 8. Relation to other tables

- **walkthroughs** — Parent of every scan; has `org_id`, `opportunity_id`, `site_id`.
- **scope_models** — Holds AI-derived scope for a walkthrough; can use `walkthrough_scans.extracted` or other walkthrough media as input.

---

## 9. Indexes (already in DB)

- `walkthrough_id` — list scans for a walkthrough.
- `org_id` — tenant filtering.
- `(walkthrough_id, created_at DESC)` — list scans for a walkthrough, newest first.
