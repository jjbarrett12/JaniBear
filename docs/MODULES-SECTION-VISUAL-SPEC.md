# Modules Section — Visual Spec

**Design agent output.** Redesign the JANIBEAR Modules section to read as an **AI-powered operating system with QR-enforced accountability**. Calm, powerful, system-level—infrastructure, not features.

---

## 1. Positioning

**Not:** “Modules that fit how you run.”  
**Is:** An AI-powered operating system with QR-enforced accountability.

**Message pillars:**
- AI decision support
- QR compliance infrastructure  
- Financial risk intelligence

**Takeaway:** “This platform enforces performance.”

---

## 2. Structure & layout

### 2.1 Grid

| Row | Cards | Notes |
|-----|--------|--------|
| **Row 1** | Sales · Operations · Command Center | 3 equal-width cards |
| **Row 2** | Proposals · Inspections & QA | 2 cards (centered or left-aligned; can span slightly wider) |

- **Stagger:** Row 2 cards offset slightly (e.g. `translate-y` or margin) so the block isn’t flat. Optional: Row 2 cards 10–20px lower or slight horizontal nudge.
- **Gap:** 16–24px between cards; 32–40px between rows.
- **Max width:** Match site container (e.g. `max-w-6xl`); section padding 24px vertical, 16–24px horizontal.

### 2.2 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Large headline]                                                        │
│  [Subhead: AI + QR, system-level]                                        │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ Sales    [•] │  │ Operations[•]│  │ Command   [•]│   ← Row 1         │
│  │ ...          │  │ ...          │  │ Center    ...│                    │
│  │ Explore  →   │  │ Explore  →   │  │ Explore   →  │                    │
│  └──────────────┘  └──────────────┘  └──────────────┘                    │
│       ┌────────────────────┐  ┌────────────────────┐                     │
│       │ Proposals      [•]  │  │ Inspections & [•]  │   ← Row 2 (stagger) │
│       │ ...                │  │ QA ...              │                     │
│       │ Explore  →         │  │ Explore  →          │                     │
│       └────────────────────┘  └────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Card spec (filled depth, dark glass)

### 3.1 Container

- **Style:** Filled depth cards (not outline-only). Dark glass: dark base + subtle **internal** gradient (e.g. top slightly lighter than bottom, or corner glow).
- **Border:** 1px; default subtle (e.g. `white/10`). On hover: border brightens (see Interactions).
- **Radius:** `rounded-xl` or `rounded-2xl` (e.g. 16–20px).
- **Padding:** 20–24px (e.g. `p-5` or `p-6`).
- **Shadow:** Soft depth at rest; slightly stronger on hover (lift).

### 3.2 Accent glows (per card)

Use a **single accent per card** for border glow, gradient tint, and/or icon/link color. Keep glows subtle (not neon).

| Card | Accent | Use for |
|------|--------|--------|
| Sales | **Blue** | Border glow, gradient tint, “Explore” + arrow |
| Operations | **Green** | Same |
| Proposals | **Purple** | Same |
| Inspections & QA | **Amber** | Same |
| Command Center | **Cyan** | Same |

**Implementation:** e.g. `border-blue-500/20` default, `hover:border-blue-500/40`; internal gradient `from-transparent via-blue-500/5 to-transparent` or similar. Avoid full saturated fills.

### 3.3 Badges (corner)

- **Placement:** Top-right (or top-left) of card; small, so they don’t dominate.
- **Style:** Small pill or tag; 10–12px type; muted background + accent border or text.
- **Labels (assign to cards):**
  - **Revenue** → Sales
  - **AI** → Proposals (and optionally Sales)
  - **Executive** → Command Center
  - **QR** → Inspections & QA (and optionally Operations)
  - **Core** → Operations

One badge per card, or two where it helps (e.g. Proposals: AI + Revenue). No more than two per card.

### 3.4 Typography inside card

| Element | Spec | Notes |
|---------|------|--------|
| **Title** | 16–18px, semibold, tight tracking | Card name (e.g. Sales, Command Center) |
| **Body** | 13–14px, regular, muted (e.g. zinc-400) | One short line; system-level, no fluff |
| **Link** | 13–14px, medium, accent color | “Explore” + arrow |

Clean bullet hierarchy only if a card has a short list; otherwise one line of body copy.

---

## 4. Section typography

| Element | Spec | Notes |
|---------|------|--------|
| **H2 (headline)** | Large, bold, tight tracking | e.g. `text-3xl md:text-4xl font-bold tracking-tight text-white` |
| **Subhead** | Calm, one line | References AI + QR / system-level; e.g. `text-lg text-zinc-400` |
| **Spacing** | Headline → subhead ~8–12px; block → cards 32–48px | Strong vertical rhythm |

No marketing fluff; copy should feel infrastructure/system-level.

---

## 5. Micro-interactions

| Element | Behavior |
|---------|----------|
| **Card** | **Lift** on hover (e.g. `-translate-y-0.5` or `translate-y-[-2px]`); transition 150–200ms ease. |
| **Border** | Brightens subtly on hover (e.g. opacity 20% → 40% for accent). |
| **Arrow** | Slides right on hover (e.g. `group-hover:translate-x-0.5` or `gap-1` → `gap-2`). |
| **Badge** | Slight glow on hover (e.g. accent shadow or border brighten); optional soft scale. |

All transitions: 150–200ms ease. No bouncy or long animations.

---

## 6. Color tokens (dark theme)

- **Section background:** Dark (e.g. black or zinc-950); can match hero/adjacent sections.
- **Card base:** Dark glass — e.g. `bg-zinc-900/80` or `bg-zinc-950/90` with subtle gradient overlay.
- **Accents:** Blue (Sales), Green (Operations), Purple (Proposals), Amber (Inspections), Cyan (Command Center). Use 500 with opacity for glows (e.g. `/10`–`/30` for fills, `/20`–`/50` for borders).
- **Text:** Headline white; body muted (zinc-400); links use card accent.
- **Border default:** `white/10` or `zinc-700`; hover with accent at low opacity.

---

## 7. Copy guidance

**Headline (example):**  
“An operating system that enforces performance.”  
or  
“AI-powered operations. QR-enforced accountability.”

**Subhead (example):**  
“Decision support, compliance infrastructure, and financial risk intelligence—built in.”

**Card body:** One short line per card; system-level. Examples:
- Sales: “Pipeline to close. AI scope, proposals, revenue.”
- Operations: “Crews, schedules, delivery. One system.”
- Command Center: “KPIs, account health, margin. See risk before P&L.”
- Proposals: “AI scope and pricing. Branded proposals in minutes.”
- Inspections & QA: “Consistent scoring, photo proof, QR accountability.”

---

## 8. Do / Don’t

| Do | Don’t |
|----|--------|
| Filled depth cards with dark glass + subtle internal gradient | Outline-only or flat cards |
| One accent glow per card (blue/green/purple/amber/cyan) | Multiple competing accents per card |
| Small corner badges (Revenue, AI, Executive, QR, Core) | Big or noisy badges |
| Card lift + border brighten + arrow slide + badge glow | No hover state or heavy animation |
| Row 1: 3 cards; Row 2: 2 cards, slightly staggered | Single flat grid of 5 |
| Large headline + calm subhead referencing AI + QR | Generic “modules that fit how you run” |
| System-level, infrastructure tone | Marketing fluff |

---

## 9. Builder checklist

1. **Layout:** Two rows — Row 1: Sales, Operations, Command Center (3 cols); Row 2: Proposals, Inspections & QA (2 cols, centered or offset).
2. **Cards:** Filled dark glass (`bg-zinc-900/80` or similar + subtle gradient); `rounded-xl` or `rounded-2xl`; padding 20–24px; border 1px subtle, accent glow on hover.
3. **Accents:** Sales blue, Operations green, Proposals purple, Inspections amber, Command Center cyan (border/gradient/link).
4. **Badges:** Top-right (or top-left); labels Revenue, AI, Executive, QR, Core mapped to correct cards; small pill style; glow on hover.
5. **Headline:** H2 bold, tight tracking; subhead calm, AI + QR.
6. **Interactions:** Hover = card lift, border brighten, arrow slide right, badge glow; 150–200ms ease.
7. **Content:** Update `homepage.ts` (or equivalent) with new headline, subhead, and card copy; keep `href` (e.g. `/demo`).
8. **Stagger:** Optional `translate-y` or margin on Row 2 so layout isn’t flat.

---

*Spec complete. Implement in `ModulesGridSection.tsx` and `homepage.ts` (or content source).*
