# Admin & Onboarding — Design Guidance

Enterprise-grade Admin and Onboarding experience. Dark mode first, Stripe-level clarity, permission-aware.

---

## Design principles

- **Fast onboarding:** Create org + invite team in under 2 minutes.
- **Admin clarity:** Clear hierarchy, zero clutter, safe defaults.
- **Serious actions:** Confirmations, warnings, audit trail visibility for role/permission changes.

---

## Style (dark-first)

- **Background:** Layered dark (e.g. `bg-[#0B0B0F]` or theme `--background`).
- **Panels:** Glass — `bg-white/5 border-white/10 backdrop-blur-md rounded-2xl`.
- **Borders:** Soft — `border-white/10`, hover `border-indigo-400/30`.
- **Typography:** Strong hierarchy — section titles `text-2xl font-semibold`, body `text-muted-foreground`.
- **Status chips:** Semantic colors — Active (emerald), Invited (amber), Deactivated (zinc/red).

---

## Component usage

| Use case | Component | Notes |
|----------|-----------|--------|
| Data tables | shadcn `Table` (or DataTable pattern) | Sticky header, row hover, compact on mobile |
| Role/status change | `Select` or `DropdownMenu` | Inline role dropdown with confirmation |
| Destructive actions | `AlertDialog` (Dialog) | Title + description + Cancel / Confirm |
| Filters + search | `Input` (search) + `Select` or tabs | Quick filter: Role, Status; search by name/email |
| Empty state | Custom card + icon + CTA | Teaches next step; primary button |
| Status | `Badge` with variant or custom chip | Active, Invited, Deactivated |
| Tooltips | shadcn `Tooltip` | “Why this matters” on role change |
| Tabs | shadcn `Tabs` | Optional for Admin sub-sections |
| Stepper | Custom steps + `Progress` or numbered steps | Onboarding: 5 steps, persistent progress |

---

## File structure

```
src/
├── app/
│   ├── app/
│   │   └── admin/
│   │       ├── layout.tsx          # Admin gate (owner/admin/manager)
│   │       ├── page.tsx            # Admin dashboard (existing)
│   │       ├── users/
│   │       │   └── page.tsx        # Users table, filters, actions
│   │       ├── invites/
│   │       │   └── page.tsx        # Invite form, bulk, invites table
│   │       ├── roles/
│   │       │   └── page.tsx        # Roles & permissions (read-only)
│   │       └── audit/
│   │           └── page.tsx        # Audit log timeline/table
│   └── onboarding/
│       ├── page.tsx                # Entry (create org single-page; or redirect)
│       └── wizard/
│           └── page.tsx            # 5-step onboarding wizard (Create Org → Template → Invite → Modules → Done)
├── components/
│   └── admin/
│       ├── admin-status-chip.tsx   # Active | Invited | Deactivated
│       ├── admin-confirm-dialog.tsx
│       ├── admin-empty-state.tsx
│       ├── admin-page-layout.tsx
│       ├── users-table.tsx         # Optional: reusable users table
│       └── ...
└── lib/
    └── admin-microcopy.ts          # Confirmations, warnings, empty states
```

---

## Microcopy (see `src/lib/admin-microcopy.ts`)

- **Role change:** Warning that changing role affects permissions; confirm to apply.
- **Deactivate user:** User will lose access; can be reactivated later.
- **Remove user:** Irreversible; user is removed from the organization.
- **Reset invite:** New invite email will be sent; previous link will stop working.
- **Invite expiration:** Invites expire in 7 days (or configured); resend to generate a new link.

---

## Nav / sidebar

- Only show Admin section (and Users, Invites, Roles, Audit) to users with `owner`, `admin`, or `manager`.
- Skeleton/loader: use shadcn `Skeleton` for table rows and cards while loading.

---

## Onboarding wizard steps

1. **Create Org** — Name, org type (if needed).
2. **Choose Template** — Optional template (e.g. Sales-first, Ops-first) or skip.
3. **Invite Team** — Add emails + roles; skip allowed.
4. **Enable Modules** — Toggle Sales / Ops modules (or skip with defaults).
5. **Done** — Summary; redirect to correct dashboard (Sales / Ops / Management) by role/modules.

Each step: short description, primary CTA, secondary skip/back, “Progress saved” when applicable.
