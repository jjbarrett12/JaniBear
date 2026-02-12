# LiDAR + Surface Strategy — JaniBear

**Principle:** LiDAR owns **geometry and area**. **Material classification** (carpet vs tile) is a **computer vision** problem; LiDAR is a supporting feature.

---

## What to use LiDAR for (high ROI)

LiDAR is excellent at:

- **Room geometry** — walls, obstacles, transitions
- **Floor area by room/zone**
- **Baseboards / edges** (sometimes)
- **Stair detection / elevation change**
- **Fast “walkthrough scan”** that feels premium and defensible in proposals

This alone upgrades the bidding + QC story: *“We measure, we document, we prove.”*

---

## What NOT to rely on LiDAR for

**Material classification (carpet vs tile) is not a LiDAR problem.**  
It’s a **computer vision** problem (texture + pattern); LiDAR can support but not replace it.

---

## The JaniBear way: carpet vs tile (by tier)

### Tier 1 (MVP, shippable fast): Assisted tagging

1. **Scan the space** — LiDAR → floor polygons / area per room.
2. **App auto-suggests surface type** from camera (best guess).
3. **User confirms** with one tap per zone:
   - Carpet  
   - Tile  
   - LVT/Vinyl  
   - Wood  
   - Concrete  
   - Other  

**Why it wins:** High accuracy without a perfect model. Fast.

### Tier 2 (Upgrade): AI segmentation with confidence

- Run an on-device or server model that returns:
  - Segmentation mask (“this region is carpet”)
  - Confidence score
- **UX:**
  - If confidence ≥ 0.85 → pre-fill surface + show “Auto-detected”
  - If &lt; 0.85 → “Confirm surface” required

### Tier 3 (Enterprise): Multi-signal classification

Combine:

- RGB texture features
- LiDAR intensity (if available)
- Micro-roughness from depth noise
- Room context (bathroom/kitchen more likely tile)

This is how you get to “creepy accurate.”

---

## MVP architecture (simple + works)

### Mobile capture

- **iPhone/iPad Pro LiDAR scan**
- Capture **3–8 still frames per room (RGB)** + metadata
- Store:
  - `room_polygon`
  - `floor_area`
  - `frames[]`
  - `user_surface_tag` (initially required)

### Server

- Save assets to storage.
- **Background job:**
  - Run segmentation/classifier on frames.
  - Output: `surface_prediction`, `confidence`, `surface_mask` (optional).

### DB fields (auditability)

| Field | Purpose |
|-------|--------|
| `surface_type_final` | What you bill/quote on (breakdown by type) |
| `surface_type_predicted` | AI/classifier output |
| `surface_confidence` | 0–1 confidence score |
| `surface_source` | `manual` \| `ai_suggested` \| `ai_confirmed` |

See migration `027_scope_surface_audit_fields.sql` and `LIDAR_SCAN_DATA_MODEL.md` for schema and `walkthrough_scans.extracted` shape.

---

## How this turns into $$$ for JaniBear

Once you have **area + surface**, you can auto-generate:

- **Bid line items** — sqft by surface type → production rates
- **Scope of work per surface** — vacuum vs mop vs scrub
- **QC checklists** that adapt to surfaces
- **Proof-of-performance reports** — e.g. “12,400 sqft tile scrubbed weekly”

This is what makes the platform feel like it’s doing real work.

---

## Related docs

- **LIDAR_SURFACE_UX.md** — Product UX spec: microcopy ("We detected: Carpet"), flows (high/low confidence), bottom sheet, operator chip.
- **LIDAR_SCAN_DATA_MODEL.md** — Scan storage, paths, `walkthrough_scans` table, `extracted` shape (rooms, floor_area, user_surface_tag).
- **MOBILE_LIDAR_ARCHITECTURE.md** — iOS app, RoomPlan, offline upload.
- **WALKTHROUGH_CAMERA_LIDAR_IMPLEMENTATION.md** — Camera + LiDAR + AI extraction and scope merge.
