# JANIBEAR Enterprise Design System

**Philosophy:** The operating system for commercial cleaning companies — calm, confident, information-dense but breathable. Think Stripe, Linear, Vercel, modern Salesforce.

## Design tokens

- **`src/lib/design-tokens/`** — `colors`, `spacing`, `shadows`, `typography`
- **Tailwind:** `navy`, `charcoal`, `card-surface`, `accent-yellow`; `rounded-2xl` (12px); `shadow-enterprise` / `shadow-enterprise-md`
- **Dark theme (globals.css):** Deep Navy background, Charcoal/Card surfaces, JANIBEAR Yellow (#F5C400) as primary for CTAs and KPI emphasis only. No large yellow backgrounds.

## Layout components (`src/components/enterprise/`)

| Component | Use |
|-----------|-----|
| **PageLayout** | Wrapper: 8px grid, `space-y-8`, `pb-8` |
| **PageHeader** | Title left, optional breadcrumb/badge, actions right |
| **KpiCard** | Single metric + optional trend + micro subtext; optional `href` |
| **KpiRow** | Grid for 4–6 KPI cards |
| **ContentGrid** | 70% primary + 30% context columns |
| **PrimaryPanel** | Left column content |
| **ContextPanel** | Right column (insights, actions) |
| **EmptyState** | Icon + title + description + optional action |
| **LoadingSkeleton** / **KpiRowSkeleton** | Calm loading placeholders |
| **SlideOverDrawer** | Right-side panel for edit/view without full-page reload |

## Module structure standard

```
<PageLayout>
  <PageHeader title={...} description={...} actions={...} />
  <KpiRow>{/* 4–6 KpiCards */}</KpiRow>
  <ContentGrid
    primary={<PrimaryPanel>...</PrimaryPanel>}
    context={<ContextPanel>...</ContextPanel>}
  />
</PageLayout>
```

## UI rules

1. **8px spacing grid** — section padding 32–48px, card padding 24px
2. **Cards:** `rounded-2xl border border-border bg-card shadow-sm`; no heavy gradients
3. **Yellow (#F5C400):** Primary CTAs, key highlights, KPI positive emphasis only
4. **Muted text:** `text-muted-foreground` (no raw gray-500 in new UI)
5. **Motion:** Subtle, 150ms ease; no cartoon feel
6. **Filters:** Persistent, stateful, visible

## Refactored modules

- **Dashboard** — PageLayout, ContentGrid (70/30), enterprise card styling on stats, quick actions, chart, schedule, recent activity
- **CRM** — PageLayout, PageHeader with title/description/actions

Other modules (Sales, Ops, Sites, Walkthrough, Financial Health) can follow the same pattern using `PageLayout`, `PageHeader`, `KpiRow`/`KpiCard`, and `ContentGrid` without changing business logic.
