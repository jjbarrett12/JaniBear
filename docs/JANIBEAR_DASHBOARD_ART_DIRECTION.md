# JANIBEAR Dashboard — Art Direction & Identity

**Product:** Commercial janitorial command center. Buildings, crews, inspections, service compliance, SLAs, revenue, account health, operational risk.

**Dashboard should feel like:** A live operations war room. A janitorial control tower. A system built for managers who run buildings, crews, and service quality daily. Unmistakably JANIBEAR, not a generic SaaS template.

**Tone:** Strong operational clarity. “Daily command” / “command center” energy. Dense but readable. Disciplined color. Premium dark-mode surfaces. Subtle industrial precision. Modern SaaS polish. **Not cheesy.**

---

## 1. Art Direction Summary

| Principle | Application |
|-----------|-------------|
| **Live war room** | Real numbers, today’s run, crew coverage, inspections due, health at a glance. No placeholder or “coming soon” as the hero. |
| **Control tower** | Buildings on route, service execution, compliance/SLA, revenue on schedule. Every section answers “what do I need to know or do right now?” |
| **Janitorial-specific** | Language and groupings reflect route, coverage, inspections, health, and revenue—not generic “analytics” or “overview.” |
| **Dense but readable** | No fluffy marketing blocks. Clear hierarchy: KPIs → attention → route → revenue → watchlists. |
| **Industrial precision** | Grid, alignment, consistent spacing. Restrained color. No decorative illustration. |
| **Executive-facing** | Clean, premium, trustworthy. Feels like the place where decisions are made. |

---

## 2. Section Naming (JANIBEAR-Specific)

Use names that sound like a control tower, not a generic dashboard.

| Avoid | Prefer |
|-------|--------|
| Operations & territory | **Today’s route** or **Route & coverage** |
| Today's route & inspections | **Route & inspections** (keep; already good) |
| Revenue pulse | **Revenue today** or **Today’s revenue** (panel title) |
| Requires attention | **Attention queue** or **Needs attention** |
| Account health watchlist | **Health watchlist** or **Accounts below threshold** |
| Crew gaps & late arrivals | **Crew status** or **Crew gaps** |

**Header subtitle:** One line that frames the page as the daily command view, e.g.  
“Daily command. Today’s run at a glance.” or “Command center. Today’s route, crew, and compliance.”

---

## 3. Icon Style

- **Library:** Lucide. Consistent stroke weight; no mixing outline and fill.
- **Semantic choices:**
  - **Buildings / route:** `MapPin` or `Building2` — locations on the run.
  - **Crew:** `Users` — coverage, headcount.
  - **Inspections:** `ClipboardCheck` — compliance, check-offs.
  - **Account health:** `Activity` or `Heart` — vitality, risk.
  - **SLA / risk:** `AlertTriangle` — breaches, attention.
  - **Revenue:** `DollarSign` or `TrendingUp` — money, schedule.
- **Style:** Same size in KPI strip (e.g. 16px). Contained in a small rounded box with variant tint. No illustration or mascot.

---

## 4. Color Mapping by Module

| Module | Meaning | Color | Use |
|--------|---------|-------|-----|
| **Route / buildings** | Neutral ops | Slate / indigo | Cards, borders when no risk. |
| **Crew** | Coverage | Emerald when full, amber when gap | KPI tile, status. |
| **Inspections** | Compliance | Neutral or indigo | Default state. |
| **Account health** | Risk level | Emerald OK, rose at risk | Health tile, watchlist. |
| **SLA** | Breaches | Rose when open, neutral when clear | SLA tile, attention rail. |
| **Revenue** | Money / schedule | Indigo or emerald | Revenue tile, financial polish. |
| **Attention** | Needs action | Amber | Alert rail, “needs attention” chips. |

Keep palette disciplined: no extra accent colors; use opacity variants for hierarchy.

---

## 5. Microcopy Examples

### KPI strip (short, scannable)

| KPI | Generic | JANIBEAR |
|-----|---------|----------|
| Buildings today | Buildings Scheduled Today | **On route today** |
| Crew | Crew Active / Required | **Crew in / required** or **Crew coverage** |
| Inspections | Inspections Due Today | **Inspections due** |
| Health | Accounts Below Health | **Health at risk** or **Below threshold** |
| SLA | SLA Breaches | **Open SLA** or **SLA at risk** |
| Revenue | Revenue Scheduled Today | **Revenue today** or **Scheduled revenue** |

### Panel titles & descriptions

- **Today’s route:** “Buildings and coverage for today’s run.”  
- **Route & inspections:** “Today’s route and inspections due.”  
- **Revenue today:** “Today and week-to-date.”  
- **Attention queue:** “Items that need a decision or action.”  
- **Health watchlist:** “Accounts below health threshold.”  
- **Crew status:** “Gaps and late arrivals.”

### Alert rail

- With items: “**3** need attention” or “Attention queue: **3**” (click to view).
- Empty: “No urgent items” or “All clear.”

### Header

- Subtitle: “Daily command. Today’s route, crew, and compliance.”  
  Or: “Command center. Today’s run at a glance.”

---

## 6. Operationally Alive (Without Clutter)

- **Live time/date** in header (already in place).
- **Real counts** in KPI tiles that reflect current data.
- **Route list** with building name + crew; optional “In progress” or “Next” on first row.
- **Attention count** that drives the alert rail; one click to queue.
- Optional: very subtle status dot or pulse on the attention rail when count > 0 (no animation overload).
- Avoid: auto-refresh every few seconds, tickers, or decorative motion. Prefer “refresh on focus” or manual refresh if needed.

---

## 7. Five High-Impact Changes (Implementation)

1. **KPI labels** — Use JANIBEAR microcopy in the cockpit data layer (On route today, Crew coverage, Inspections due, Health at risk, Open SLA, Revenue today).
2. **Header subtitle** — Single line that frames the page as daily command / control tower.
3. **Section titles** — Rename main and side panels to JANIBEAR section names (Today’s route, Route & inspections, Revenue today, Attention queue, Health watchlist, Crew status).
4. **Alert rail copy** — “X need attention” or “Attention queue: X” (and “All clear” when zero).
5. **Centralized copy** — One source of truth for dashboard strings (e.g. `dashboard-copy.ts`) so the voice stays consistent and future copy changes are easy.

Implementing these five will make the dashboard feel custom and premium without a full redesign.
