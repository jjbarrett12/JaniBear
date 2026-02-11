# Walkthrough Camera & LiDAR — Implementation Guide

This guide explains what you need to do to get **camera**, **LiDAR**, and **AI extraction** working so the walk-through captures **square footage**, **flooring types**, and other useful data—and feels like a real tool, not a gimmick.

---

## Current State (What Exists Today)

| Piece | Status |
|-------|--------|
| **Walkthrough form** | Creates walkthrough + scope from **manual** entry (sqft, flooring, restrooms). No camera in flow. |
| **Walkthrough detail** | Shows `walkthrough_media` (photos/video/audio) but **no UI to capture or upload** media. |
| **walkthrough_media table** | Exists (photo, video, audio + `storage_path`). Ready for uploads. |
| **walkthrough_scans table** | Exists for LiDAR/RoomPlan. Storage paths documented in `LIDAR_SCAN_DATA_MODEL.md`. |
| **Scope model** | Already has `square_footage`, `flooring` (hard_surface, carpet, tile), `restroom_count`. Ready for AI/LiDAR data. |
| **Extract-scope API** | Uses **transcript only** (stub). Does not use photos or LiDAR. |
| **AI (src/lib/ai)** | `extractScope()` and `transcribeAudio()` are **stubs**. No vision API yet. |
| **iOS LiDAR app** | Not started (per `CURSOR_SPEC_MULTI_ORG.md`). |

So: the **data model and storage are ready**. What’s missing is (1) **capture/upload** (camera + optional LiDAR), (2) **real AI** (vision + transcript), and (3) **merging** extracted data into scope and walkthrough UX.

---

## What You Need to Do (High Level)

1. **Camera path (works everywhere)**  
   - Add in-app capture (photo/video) during or after creating a walkthrough.  
   - Upload to `walkthrough-media` bucket and insert rows in `walkthrough_media`.  
   - Use **vision AI** (e.g. OpenAI GPT-4 Vision or similar) on photos to estimate: square footage (from room size cues), flooring types, restroom count, fixtures, special areas.  
   - Optionally: transcribe audio (Whisper), then run **extractScope** on transcript + vision results combined.

2. **LiDAR path (iOS, when available)**  
   - Build a small **iOS app** (or use existing plan under `apps/ios-scan/`) that uses **RoomPlan** to capture a scan, then uploads `.usdz` + preview images to Supabase (see `LIDAR_SCAN_DATA_MODEL.md`).  
   - Backend job or Edge Function: process scan (or use RoomPlan metadata) → fill `walkthrough_scans.extracted` (e.g. `rooms[]`, `total_sqft`, `surfaces`).  
   - When building scope: **prefer LiDAR `extracted`** when present (more accurate sqft), and optionally use vision for flooring type and other details LiDAR doesn’t give.

3. **Make it non-gimmicky**  
   - **Guided capture**: e.g. “Capture lobby,” “Capture restrooms,” “Capture main corridors.”  
   - **Confidence + override**: Show AI-derived sqft/flooring as “Suggested” and let the user edit.  
   - **Single source of truth**: Merge vision + LiDAR + transcript into one `scope_models.extracted_json` and use it for proposals.

Below is a concrete, step-by-step plan.

---

## Step 1: Camera Capture & Upload (Web / PWA)

**Goal:** User can take photos (and optionally video) during a walkthrough and have them stored and linked to the walkthrough.

1. **Storage**  
   - Ensure bucket `walkthrough-media` exists in Supabase and RLS allows org members to upload/read under paths you use (e.g. `org/{org_id}/walkthroughs/{walkthrough_id}/...`).

2. **UI**  
   - On **walkthrough detail** page (`/app/walkthroughs/[id]`), add a “Capture” or “Add media” section:
     - Use browser **MediaDevices API** (`navigator.mediaDevices.getUserMedia`) for camera.
     - Or `<input type="file" accept="image/*,video/*" capture="environment">` for mobile-friendly photo/video.
   - On capture/select:
     - Upload file to Supabase Storage (path like `org/{org_id}/walkthroughs/{walkthrough_id}/{uuid}.jpg`).
     - Insert into `walkthrough_media`:
       - `org_id`, `walkthrough_id`, `type`: `'photo'` or `'video'`, `storage_path`: path used in Storage.

3. **Optional: In-flow capture**  
   - Alternatively (or in addition), after “New Walkthrough” you could redirect to a **capture-first** flow: create a minimal walkthrough (or draft), then open camera to add N photos, then go to the form to fill the rest or let AI prefill from photos.

**Deliverable:** User can add photos (and optionally video) to a walkthrough; they show up under “Photos, videos, and audio” on the detail page.

---

## Step 2: Vision AI — Extract Sqft, Flooring, and More from Photos

**Goal:** From walkthrough photos, produce structured data: square footage (estimate), flooring types per area, restroom count, and other useful fields.

1. **API route**  
   - Add an API route (e.g. `POST /api/extract-scope-from-media`) that:
     - Accepts `walkthrough_id`.
     - Loads walkthrough (and checks org).
     - Fetches recent `walkthrough_media` rows (e.g. type `photo`, limit 10–20).
     - Downloads image URLs (signed if private bucket).
     - Calls a **vision** model with a structured prompt (see below).
     - Returns (and optionally saves) extracted JSON.

2. **Vision model**  
   - Use **OpenAI GPT-4 Vision** (or another vision API) with a prompt that asks for:
     - **Square footage**: “Estimate total cleanable floor area in sq ft from the visible spaces (e.g. room size, number of rooms).”
     - **Flooring**: “List flooring types and approximate area (sq ft): e.g. carpet, tile, VCT/hard surface, hardwood.”
     - **Restrooms**: “Count of restroom/bathroom areas.”
     - **Other**: “Note any special areas: lobby, kitchen, lab, gym, high-traffic zones; any fixtures or equipment that affect cleaning (e.g. many glass doors, sensitive flooring).”
   - Ask for output as **JSON** matching (or easily mappable to) your `scope_models.extracted_json` shape (e.g. `site.square_footage`, `site.flooring`, `site.restroom_count`, and a `notes` or `special_requirements` field).

3. **Merge into scope**  
   - When you get the vision result:
     - Either **create** a new `scope_models` row for this walkthrough with the vision-derived `extracted_json`, or
     - **Update** an existing scope (e.g. merge with transcript-derived or manual data).
   - Set a **confidence** (e.g. 0.7 for vision-only) and/or a `source: 'vision'` so the UI can show “Suggested from photos.”

**Deliverable:** Backend can turn walkthrough photos into structured scope (sqft, flooring, restrooms, notes). This can be triggered from the walkthrough detail page (“Extract from photos”) or after upload.

---

## Step 3: LiDAR / RoomPlan (iOS)

**Goal:** On supported iOS devices, capture RoomPlan data and get accurate room-by-room sqft; store in `walkthrough_scans` and use in scope.

1. **Native app**  
   - Per `LIDAR_SCAN_DATA_MODEL.md`:
     - Create a walkthrough first (from web or from app).
     - In the app: list walkthroughs for the org, let user pick one, then start RoomPlan capture.
     - Export RoomPlan (e.g. `.usdz`), generate 1–3 preview images.
     - Insert row in `walkthrough_scans` (with `walkthrough_id`, `org_id`, `status: 'uploaded'`), then upload files to the `walkthrough-scans` bucket under the documented path convention.
     - Update the row with `roomplan_raw_path` and `preview_images`.

2. **Backend processing**  
   - RoomPlan format can contain room dimensions. Options:
     - **Option A:** Use Apple’s RoomPlan API / export format to extract room names and areas (if available in your export).
     - **Option B:** Run a small backend/Edge Function that sets `status = 'processing'`, then (if you have a mesh/volume pipeline) computes approximate sqft from the mesh; otherwise, use placeholder and set `status = 'ready'` with a note that “LiDAR data stored for future processing.”
   - Write result into `walkthrough_scans.extracted`, e.g.:
     - `rooms: [{ name, sqft }, ...]`, `total_sqft`, `surfaces`.
   - Set `status = 'ready'` (or `'failed'` on error).

3. **Scope merge**  
   - When building or updating scope for a walkthrough:
     - If any `walkthrough_scans` row has `status = 'ready'` and `extracted.total_sqft`, use that as the **primary** square footage (and optionally room breakdown).
     - Use vision for **flooring types** and **restroom count** if LiDAR doesn’t provide them.
   - So: **LiDAR = authoritative for sqft when present; vision = for flooring and other details.**

**Deliverable:** iOS app can capture and upload RoomPlan; backend can store and optionally process it; scope logic prefers LiDAR sqft when available.

---

## Step 4: Transcript + Audio (Optional but Valuable)

**Goal:** If the user records voice notes during the walkthrough, transcribe and use that in scope extraction too.

1. **Upload audio**  
   - Same as photos: upload to Storage, insert into `walkthrough_media` with `type: 'audio'`.

2. **Transcribe**  
   - Existing `/api/transcribe` (or similar) should:
     - Take `walkthrough_id` and `audio_storage_path`.
     - Call **Whisper** (or your chosen provider), then insert into `walkthrough_transcripts`.

3. **Extract from text**  
   - Your current `extractScope()` in `src/lib/ai/index.ts` is a stub. Replace it with a call to an LLM (e.g. GPT-4) with a prompt that asks for the same structured fields (sqft, flooring, restrooms, special requirements) from the transcript text.
   - Existing `POST /api/extract-scope` already reads the transcript and writes to `scope_models`. Once `extractScope()` is real, that flow will work.

4. **Merge**  
   - When you have both **vision** and **transcript** (and optionally LiDAR):
     - Combine into one `extracted_json`: e.g. prefer LiDAR for sqft, vision for flooring/restrooms, transcript for “special requirements” and narrative notes.
     - Single scope row per walkthrough with a clear merge strategy (e.g. “LiDAR sqft > vision sqft > transcript sqft”).

**Deliverable:** Audio is transcribed; transcript is used to extract scope; one merged scope drives proposals.

---

## Step 5: UX — Make It Feel Real (Not a Gimmick)

1. **Guided capture**  
   - Suggest steps: “Add a few photos of the main areas,” “Capture lobby, restrooms, and corridors.”  
   - Optional: simple checklist (e.g. “Lobby ✓, Restrooms ✓, Floors ✓”) so the user knows what’s useful for AI.

2. **Show “Suggested” and allow edit**  
   - Display AI-derived sqft and flooring as “Suggested from photos” (and “From LiDAR” when applicable) with clear **Edit** controls.  
   - Prefill the walkthrough form (or scope summary) with these values but never present them as final until the user confirms or edits.

3. **Confidence**  
   - Store and show confidence (e.g. from vision or from LiDAR). Low confidence → nudge user to “Review and adjust numbers.”

4. **What “Jani” can help with**  
   - From photos + transcript, Jani can:
     - **Square footage** (estimate from rooms; better with LiDAR when available).
     - **Flooring types** (carpet, tile, VCT, hardwood, etc.) and approximate areas.
     - **Restroom count** and high-moisture areas.
     - **Special areas**: lobby, kitchen, lab, gym, entryways (high traffic).
     - **Notes**: “Many glass doors,” “sensitive flooring in server room,” “food service area.”
   - Keep copy operator-friendly: “Suggested,” “Estimated from your photos,” “You can edit below” (per your `.cursor/rules` and joint-employer constraints).

---

## Technical Checklist

- [ ] **Storage:** `walkthrough-media` bucket + RLS for org-scoped upload/read.
- [ ] **Storage:** `walkthrough-scans` bucket + RLS (see `LIDAR_SCAN_DATA_MODEL.md`).
- [ ] **Camera UI:** Capture photos (and optionally video) on walkthrough detail or capture flow; upload to Storage; insert `walkthrough_media`.
- [ ] **Vision API:** New route that loads walkthrough photos, calls GPT-4 Vision (or equivalent), returns/maps to `extracted_json` (sqft, flooring, restrooms, notes).
- [ ] **Scope merge:** Logic that combines vision + LiDAR + transcript into one `scope_models` row; LiDAR sqft overrides when present.
- [ ] **AI stubs:** Replace `extractScope()` and `transcribeAudio()` in `src/lib/ai` with real OpenAI (or other) calls.
- [ ] **Extract-scope API:** Optionally extend to accept “use photos” (vision) and “use scans” (LiDAR) as well as transcript.
- [ ] **iOS app (optional):** RoomPlan capture → upload to `walkthrough-scans` and insert/update `walkthrough_scans`; backend sets `extracted` and `status = 'ready'`.
- [ ] **UX:** Guided capture hints, “Suggested” labels, and edit capability for all AI-derived fields.

---

## Summary

- **Camera + vision** gets you most of the value quickly: square footage estimate, flooring types, restroom count, and notes. Implement capture/upload first, then the vision extraction API, then merge into scope and show as “Suggested” with edits.
- **LiDAR** adds accurate sqft and room breakdown on iOS; implement when you’re ready to support the native app and backend processing.
- **Transcript** improves scope (especially special requirements and narrative); wire real Whisper + `extractScope()` and merge with vision/LiDAR.
- **UX**: guided capture, confidence, and always allow the user to override so the walk-through feels like a helpful tool, not a gimmick.

If you tell me which you want to implement first (camera upload, vision API, or LiDAR app), I can outline or generate the exact code changes next (e.g. new API route, new component for capture, or updates to `extractScope` and scope merge).
