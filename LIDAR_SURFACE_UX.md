# LiDAR Surface Confirmation — Product UX Spec

**Goal:** Surface confirmation should feel like **“We detected carpet. Confirm?”** — not “Select flooring type.” JaniBear feels **intelligent**, not like a form.

---

## Principle

- **Never** lead with a blank “Select flooring type.”  
- **Always** lead with intelligence when we have it: “We detected: Carpet” → confirm or change.  
- When we don’t have confidence, **then** ask: “What surface is this?” with clear choices.

---

## Surface type options (canonical)

Use these values in API/DB and in UI labels:

| Value     | Label (UI)   |
|----------|---------------|
| `carpet` | Carpet        |
| `tile`   | Tile          |
| `lvt`    | LVT / Vinyl   |
| `wood`   | Wood          |
| `concrete` | Concrete    |
| `other`  | Other         |

---

## Flow A: High confidence (≥ 0.85)

**When:** AI/model returns a surface with confidence ≥ threshold (e.g. 0.85).

### Primary microcopy (recommended)

| Element      | Copy |
|-------------|------|
| **Header**  | **We detected: {Surface}** (e.g. “We detected: Carpet”) |
| **Subtext** | Based on texture and scan data. Tap to confirm or change. |
| **Primary CTA** (solid) | ✔ Confirm {Surface} (e.g. “✔ Confirm Carpet”) |
| **Secondary** (text)    | Change Surface Type |

### Premium variant (more advanced tone)

| Element      | Copy |
|-------------|------|
| **Header**  | Surface identified: {Surface} |
| **Subtext** | Confirm or adjust before continuing. |
| **Primary CTA** | Confirm & Continue |

Use **Confirm & Continue** when you want the flow to feel fast and “next step” rather than “form field.”

---

## Flow B: Low confidence (&lt; 0.85 or no prediction)

**When:** No model run, or confidence below threshold.

| Element      | Copy |
|-------------|------|
| **Header**  | What surface is this? |
| **Subtext** | Select the primary flooring type for this area. |
| **Actions**  | Buttons (one per option): Carpet · Tile · LVT / Vinyl · Wood · Concrete · Other |

No “Confirm” step — selection **is** the confirmation. After tap, advance to next room or next step.

---

## Flow C: Ultra-fast field (Operator mode)

**When:** Speed matters more than polish (e.g. field ops, repeat scans).

- **Placement:** Overlay chip directly on the scan / room card.
- **Content:** `[ {SURFACE} ✓ ]` and `[ Change ]`.
- **Behavior:** Single tap on the chip = confirm and advance to next room. “Change” opens the same flows (A or B) in a compact way (e.g. bottom sheet or inline picker).

Example:

```
[ CARPET ✓ ]   [ Change ]
```

Keeps the user in context with minimal taps.

---

## UX placement

**Where this appears:**

- After room scan completes (per room).
- When user taps a floor polygon (if you support tap-to-edit).
- As a **bottom sheet** (recommended).
- Or as an AR overlay label (future).

### Recommended pattern: Bottom sheet slide-up

- **Top:** Room name + area  
  - e.g. **Office 102** · 342 sq ft  
- **Middle:** Surface line  
  - High confidence: “We detected: Carpet” or “Surface identified: Carpet”  
  - Low confidence: “What surface is this?” + button row  
- **Bottom:** Primary + secondary actions  
  - High: [ ✔ Confirm Carpet ] and “Change Surface Type”  
  - Premium: [ Confirm & Continue ] and “Change Surface Type”  

**Why bottom sheet:** Scan stays visible behind it. Feels modern and keeps context (room shape, area) in view.

---

## Copy summary (single source for implementation)

### High-confidence block

```
HEADER:    We detected: {Surface}
SUBTEXT:   Based on texture and scan data. Tap to confirm or change.
PRIMARY:   ✔ Confirm {Surface}
SECONDARY: Change Surface Type
```

### Premium high-confidence (alternate)

```
HEADER:    Surface identified: {Surface}
SUBTEXT:   Confirm or adjust before continuing.
PRIMARY:   Confirm & Continue
SECONDARY: Change Surface Type
```

### Low-confidence block

```
HEADER:    What surface is this?
SUBTEXT:   Select the primary flooring type for this area.
BUTTONS:   Carpet | Tile | LVT / Vinyl | Wood | Concrete | Other
```

### Operator chip (overlay)

```
[ {SURFACE} ✓ ]   [ Change ]
```

---

## Implementation notes

- **Confidence threshold:** Use a single constant (e.g. `0.85`) so high vs low flow is consistent across app and server.
- **Room label:** Always show “Room name · X sq ft” when confirming surface so the user knows which room they’re tagging.
- **Accessibility:** Ensure “Confirm {Surface}” and “Change Surface Type” have clear labels for screen readers; bottom sheet should trap focus and support dismiss (swipe or button).

---

## Related

- **LIDAR_AND_SURFACE_STRATEGY.md** — Strategy (LiDAR = geometry; vision = surface; tiers).
- **LIDAR_SCAN_DATA_MODEL.md** — `user_surface_tag`, `surface_prediction`, `surface_confidence` in `extracted`.
