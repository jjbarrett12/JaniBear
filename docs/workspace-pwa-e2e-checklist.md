# Workspace + PWA E2E QA Checklist

Use this checklist to verify tenant-specific workspace URLs, PWA install, and auth/deep link flows.

---

## How to validate

1. **Automated (Playwright)**  
   - Run: `npm run test:e2e` (starts dev server, runs E2E).  
   - Covers: unknown-slug same status/redirect/headers, PWA no-cache of `/app/*` when offline, launcher unauthenticated redirect.  
   - Optional: `npm run test:e2e:ui` for interactive runs.

2. **Manual (pre-release)**  
   - Work through sections A–F below.  
   - For slug/rate-limit: use path-based URLs (e.g. `/org/fake-org/app/dashboard`) and confirm redirect to marketing root; repeat and confirm no differing headers (e.g. no `X-RateLimit-*` only when blocked).  
   - For PWA: open DevTools → Application → Cache Storage; confirm no entries for `/app/*` document requests; go offline and reload `/app/dashboard` — should not load from cache.  
   - For launcher: log out, visit `/launcher` → redirect to login with `?next=/launcher`; log in with 1 org → brief “Opening workspace…” then redirect; with multiple orgs → org list with workspace links.

3. **Local dev without subdomains**  
   - Set `NEXT_PUBLIC_DEV_WORKSPACE_MODE=path`.  
   - Launcher and workspace links use path-based URLs (`/org/{slug}/app/dashboard`). Prod behavior unchanged.

---

## Environment

- **Root domain:** Set `NEXT_PUBLIC_APP_DOMAIN=janibear.com` (or your production domain).
- **Subdomains:** Ensure `*.janibear.com` resolves to the same app (e.g. Vercel wildcard or DNS CNAME).

---

## A) Multi-tenant routing

- [ ] **Unknown org slug (subdomain)**  
  Visit `https://unknown-org.janibear.com`. Expect redirect to `https://janibear.com` (marketing root).

- [ ] **Unknown org slug (path)**  
  Visit `https://janibear.com/org/unknown-org/app/dashboard`. Expect redirect to marketing root.

- [ ] **Known org slug (path)**  
  Visit `https://janibear.com/org/{valid-slug}/app/dashboard`. Expect rewrite to `/app/dashboard` and workspace loads with that org (user must be member).

- [ ] **Subdomain workspace**  
  Visit `https://{valid-slug}.janibear.com/app/dashboard`. Expect workspace loads; `x-resolved-org-id` and `active_org_id` cookie set when user is member.

- [ ] **Workspace root redirect**  
  Visit `https://{valid-slug}.janibear.com/`. Expect redirect to `https://{valid-slug}.janibear.com/app/dashboard`.

---

## B) Org branding

- [ ] **Workspace layout**  
  In `/app/*`, header/sidebar shows org name and logo from `org_settings` (or `organizations` fallback).

- [ ] **Theme**  
  When `org_settings.primary_color` / `accent_color` (or org branding) are set, theme applies in the app shell.

---

## C) PWA

- [ ] **Dynamic manifest**  
  `GET /manifest.webmanifest` returns JSON. On workspace host (subdomain or path), `name` is `"JANIBEAR — {org display name}"`; on marketing host, `name` is `"JANIBEAR"`. `start_url: "/app/dashboard"`, `display: "standalone"`, icons (192 + 512, any + maskable).

- [ ] **Manifest referenced in layout**  
  Root layout (or head) has `<link rel="manifest" href="/manifest.webmanifest" />` and metadata `manifest: "/manifest.webmanifest"`.

- [ ] **Service worker registration**  
  Visiting any `/app/*` route registers `/sw.js` once (check DevTools → Application → Service Workers). No duplicate registrations on navigation.

- [ ] **Service worker privacy (no cache /app/* HTML)**  
  Navigate to `/app/dashboard` (or any `/app/*` document). In DevTools → Application → Cache Storage, confirm no HTML/document response for `/app/*` is cached. Only `janibear-static-v2` cache used; only static assets (JS, CSS, fonts, icons) cached. No cache for `request.mode === 'navigate'`, `request.destination === 'document'`, `/app/*`, `/api/*`, `/auth/*`.

- [ ] **SW cache cleanup**  
  On activate, all caches except `janibear-static-v2` are deleted (no old shell caches).

- [ ] **API/auth never cached**  
  Requests to `/api/*` and `/auth/*` are network-only (no cache read/write).

- [ ] **Install prompt (Chromium)**  
  On supported browser (Chrome/Edge), visit app; "Install app" or install icon appears. Dismissible; after install, PWA opens in standalone window.

- [ ] **Safari iOS**  
  On iPhone/iPad, install prompt shows "Add to Home Screen" instructions (share → Add to Home Screen).

- [ ] **Standalone window**  
  After install, launch from desktop/home screen; app opens in its own window (no browser chrome).

---

## D) Auth & deep links

- [ ] **Login at workspace URL**  
  Visit `https://{slug}.janibear.com/auth/login`. Sign in. Expect redirect to `https://{slug}.janibear.com/app/dashboard` (or onboarding if pending).

- [ ] **Deep link in email**  
  Link like `https://{orgSlug}.janibear.com/app/dashboard` or `https://janibear.com/org/{slug}/app/dashboard`. Logged-in member lands on dashboard in that org.

- [ ] **`next` param**  
  Visit `/auth/login?next=/app/dashboard`. After login, redirect to `/app/dashboard`.

- [ ] **Continue as re-entry**  
  Visit `/app/entry` when logged in and org member. See "Continue as {email} @ {orgName}" and "Continue to workspace" → `/app/dashboard`.

- [ ] **Session persists**  
  Close PWA or tab; reopen workspace URL. Session persists; no forced re-login (within cookie/session lifetime).

---

## E) Security

- [ ] **Slug resolution (no enumeration leak)**  
  `get_org_id_by_slug` is SECURITY DEFINER with constant-time behavior (migration 093). Middleware uses same redirect target for unknown slug; no differing headers or status codes that would leak org existence.

- [ ] **Rate limiting (slug resolution)**  
  Per-IP: 60 req/min baseline; tighter after repeated unknown slugs (see `slug-rate-limit.ts`). Blocked and unknown both return same 302 redirect to marketing root; no differing cache or rate-limit headers.

- [ ] **Server actions**  
  All server actions that touch org data use `requireOrgMember(orgId)` or `requirePermission(orgId, "permission.key")`.

- [ ] **DB / RLS**  
  All tenant tables enforce RLS with `org_id` (or equivalent); no cross-tenant data leak.

- [ ] **API routes**  
  `/api/orgs/[orgId]/*` (and similar) verify membership/permission before returning data.

---

## F) Workspace launcher (multi-org)

- [ ] **Launcher route**  
  Visit `/launcher` when authenticated. If user has multiple orgs, page lists orgs (name + logo) with buttons opening `https://{slug}.{ROOT_DOMAIN}/app/dashboard`.

- [ ] **Single-org redirect**  
  If user has exactly one org, launcher shows "Opening workspace…" and redirects to that workspace URL after a short delay (~1s).

- [ ] **Launcher auth**  
  Unauthenticated visit to `/launcher` redirects to `/auth/login?next=/launcher`; after login, user returns to `/launcher`.

- [ ] **No-org redirect**  
  User with zero orgs hitting launcher (or app) is redirected to `/onboarding`.

---

## G) Local dev fallback

- [ ] **Path mode**  
  With `NEXT_PUBLIC_DEV_WORKSPACE_MODE=path`, launcher and workspace links use `/org/{slug}/app/dashboard` instead of subdomain. No wildcard DNS required. Prod behavior unchanged.

---

## Quick reference: workspace URLs

| URL pattern | Behavior |
|-------------|----------|
| `https://janibear.com` | Marketing site |
| `https://{slug}.janibear.com/` | Redirect → `/app/dashboard` (if slug valid) |
| `https://{slug}.janibear.com/app/*` | Workspace app (org = slug) |
| `https://janibear.com/org/{slug}/app/*` | Rewrite to `/app/*`, org = slug |
| Unknown slug | Redirect to `https://janibear.com` |
| `https://janibear.com/launcher` | Workspace picker (auth required; redirects to login with `?next=/launcher`) |

## Deep link template for emails

```
https://{orgSlug}.janibear.com/app/dashboard
```

or path fallback:

```
https://janibear.com/org/{orgSlug}/app/dashboard
```

Replace `{orgSlug}` with the organization’s `slug` from `organizations.slug`.

---

## Automated tests (Playwright)

| Test file | Coverage |
|-----------|----------|
| `e2e/workspace-slug.e2e.ts` | Unknown slug → same 302 + redirect; no differing headers |
| `e2e/pwa-privacy.e2e.ts` | Offline reload of `/app/dashboard` does not serve cached document |
| `e2e/launcher.e2e.ts` | Unauthenticated `/launcher` → login with `next=/launcher`; placeholders for 1-org / multi-org / no-org (require auth fixtures) |
