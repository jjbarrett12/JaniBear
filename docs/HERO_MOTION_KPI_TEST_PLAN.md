# Hero Motion + KPI Strip — Test Plan

Use this checklist to validate hero motion, KPI strip, CTAs, and performance. Run after any change to `Hero.tsx`, `HeroParticles.tsx`, `hero-kpi-strip.tsx`, `HeroBackdropImage`, or hero-related CSS in `globals.css`.

---

## 1. prefers-reduced-motion

**Goal:** Shimmer, dust, parallax, and count-up are disabled when the user prefers reduced motion.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 1.1 | **Enable reduced motion** — Chrome DevTools → Cmd/Ctrl+Shift+P → "Show Rendering" → check "Emulate CSS media feature prefers-reduced-motion: reduce". Reload `/`. | | |
| 1.2 | **Background breath** — The radial glow behind the hero (`.hero-bg-breath`) has no animation; it is a static opacity (~0.24). | | CSS: `@media (prefers-reduced-motion: reduce) { .hero-bg-breath { animation: none !important; opacity: 0.24; } }` |
| 1.3 | **Dust particles** — No particle layer is visible. `HeroParticles` is not rendered when `useReducedMotion()` is true. | | `Hero.tsx`: `{motionOn && <HeroParticles />}`; Framer `useReducedMotion()` respects system preference. |
| 1.4 | **Shimmer / parallax** — Current hero does not use `.hero-shimmer-layer` or `.hero-parallax-layer` in JSX. If any legacy element had those classes, they would be disabled by CSS `@media (prefers-reduced-motion: reduce)`. | | Verify no such elements in Hero. |
| 1.5 | **KPI count-up** — KPI strip numbers show final values immediately (24, 3, 5, $9,912) with no count-up animation. | | `HeroKpiStrip` receives `reduceMotion={!!reduceMotion}`; `AnimatedCount` skips animation and sets `display` to `value` when `reduceMotion` is true. |
| 1.6 | **Disable reduced motion** — Uncheck "Emulate prefers-reduced-motion" and reload. Breath animation, particles, and KPI count-up should run again. | | |

---

## 2. CPU / performance (no jank)

**Goal:** No excessive CPU usage or frame drops during hero motion.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 2.1 | Open Chrome DevTools → **Performance** tab. Start recording, load `/` (or refresh), let hero and KPI strip animate, stop after ~5 s. | | |
| 2.2 | **Main thread** — No long tasks (>50 ms) that block the main thread during idle; animation work should be minimal (CSS + one RAF loop per KPI count). | | |
| 2.3 | **FPS** — No sustained drops below ~55 FPS; occasional dips during load are acceptable. | | |
| 2.4 | **No layout thrash** — No repeated layout/reflow from reading layout and then mutating DOM in a loop (KPI strip uses RAF for count, then setState once per frame). | | |

---

## 3. Readable at all breakpoints

**Goal:** Hero headline, subhead, trust bar, device image, KPI strip, and CTAs are readable and properly sized at mobile, tablet, and desktop.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 3.1 | **Mobile (320px–480px)** — Headline wraps; font size at least ~1.5rem; no horizontal overflow; KPI strip wraps; CTAs stack; no text under the sticky bottom CTA. | | `hero-headline` + responsive text classes. |
| 3.2 | **Tablet (768px–1024px)** — Headline and subhead scale up; KPI strip fits in one or two rows; CTAs side-by-side where space allows. | | |
| 3.3 | **Desktop (1280px+)** — Max-width container constrains line length; headline gradient and subhead remain legible; contrast meets WCAG for white/light text on dark background. | | |
| 3.4 | **Touch targets** — Primary and secondary CTAs, "Watch 90-sec demo" button, and sticky "See the Command Center" are at least 44px height. | | |

---

## 4. Dust particles never overlap headline (z-index / mask)

**Goal:** Dust stays behind the headline and all hero content.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 4.1 | **Stacking** — Particle layer has `z-0`; content wrapper (headline, trust bar, device, KPI strip, CTAs) has `z-10`. Content always paints on top. | | `HeroParticles.tsx`: `hero-particles-layer ... z-0`. `Hero.tsx`: content div `relative z-10`. |
| 4.2 | **Clip region** — Particles are clipped to the top 60% of the hero (`clipPath: inset(0 0 40% 0)`), so they do not appear in the lower area where the KPI strip and CTAs sit. | | |
| 4.3 | **Visual check** — At desktop width, scroll so the hero is in view; confirm no white dots overlap the headline text "The Operating System for Commercial Cleaning." | | |
| 4.4 | **Reduced motion** — With reduced motion on, no particles are rendered; no z-index issue. | | |

---

## 5. KPI strip count-up: triggers once, no re-run on scroll

**Goal:** Count-up runs a single time when the KPI strip enters view; it does not restart when the user scrolls away and back.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 5.1 | **Fresh load** — Open `/` in a new tab. When the hero/KPI strip enters view, numbers count up from 0 to 24, 3, 5, 9912 once. | | `AnimatedCount` uses `hasAnimated` state; on first `entry.isIntersecting`, it sets `hasAnimated(true)` and runs the RAF loop. |
| 5.2 | **Scroll away and back** — Scroll down so the KPI strip is off-screen, then scroll back so it is in view. Numbers remain at final values; they do not count up again. | | Observer callback checks `if (!entry.isIntersecting || hasAnimated) return;` so the animation does not re-run. |
| 5.3 | **Reduced motion** — With prefers-reduced-motion, numbers show final values immediately and never animate. | | |

---

## 6. CTA links and demo modal

**Goal:** All hero CTAs work; demo modal opens and closes correctly.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 6.1 | **Primary CTA** — "See the Command Center" (or `HOMEPAGE.hero.ctaPrimary`) is a link to `/demo`. Click navigates to `/demo`. | | `<Link href="/demo">` inside `Button asChild`. |
| 6.2 | **Secondary CTA** — "Watch 90-sec demo" button opens the demo modal (no navigation). Modal is visible with title/placeholder and "Go to full demo" link. | | `onClick={() => setDemoModalOpen(true)}`; `DemoModal` renders when `demoModalOpen` is true. |
| 6.3 | **Modal: Close button** — "Close" button in the modal closes it; hero is visible again. | | `onClose={() => setDemoModalOpen(false)}`. |
| 6.4 | **Modal: Escape** — Press Escape with modal open; modal closes. | | `useEffect` in `DemoModal` adds `keydown` listener for `Escape`. |
| 6.5 | **Modal: Overlay click** — Click the dark backdrop (outside the modal content); modal closes. | | Backdrop has `onClick={onClose}`. |
| 6.6 | **Modal: "Go to full demo"** — Link inside the modal goes to `/demo` and navigates; modal can be closed first or user may navigate with modal open (acceptable). | | `<Link href="/demo">`. |
| 6.7 | **Sticky bottom CTA (mobile)** — "See the Command Center" in the fixed bottom bar (visible on mobile only) links to `/demo` and navigates. | | In `page.tsx`; same as primary CTA. |

---

## 7. Lighthouse: layout shift and performance

**Goal:** No meaningful layout shift; good performance score.

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| 7.1 | **Lighthouse (Mobile or Desktop)** — Run Lighthouse for the homepage `/` (Performance + Best Practices). | | |
| 7.2 | **CLS (Cumulative Layout Shift)** — CLS should be low (e.g. &lt; 0.1). Hero and KPI strip should not cause visible shift: images have dimensions or placeholder; count-up does not resize the KPI cards (numbers use tabular-nums and similar width). | | |
| 7.3 | **LCP** — Largest Contentful Paint is acceptable for the hero (image or headline). Priority loading is used for hero image and logo. | | |
| 7.4 | **Performance score** — Aim for green; hero motion (CSS animations + one-shot count-up) should not heavily impact score. | | |
| 7.5 | **No layout shift from modal** — Opening the demo modal uses `position: fixed` and `overflow: hidden` on body; the page behind does not shift. | | |

---

## Implementation reference (current behavior)

- **Hero motion:** `hero-bg-breath` (radial glow opacity keyframes), `HeroParticles` (dust with `.hero-particle`), static `hero-noise`. No shimmer/parallax layers in current Hero.
- **Reduced motion:** Framer Motion `useReducedMotion()` in Hero and HeroKpiStrip; CSS `@media (prefers-reduced-motion: reduce)` for `.hero-bg-breath`, `.hero-particle`, and legacy motion classes.
- **Z-index:** Particle layer `z-0`, content wrapper `z-10` so headline and content are always above dust.
- **KPI count-up:** `AnimatedCount` in `hero-kpi-strip.tsx` uses IntersectionObserver and `hasAnimated` so the animation runs once per mount when in view.

---

## Quick regression checklist

- [ ] Reduced motion: breath static, no particles, KPI numbers static.
- [ ] No jank in Performance recording.
- [ ] Hero readable at 320px, 768px, 1280px.
- [ ] Dust does not overlap headline (z-10 content, z-0 particles).
- [ ] KPI count-up runs once; no re-run on scroll.
- [ ] Primary CTA → `/demo`; "Watch 90-sec demo" opens modal; modal closes via Close, Escape, overlay.
- [ ] Lighthouse: CLS &lt; 0.1, acceptable LCP and performance score.
