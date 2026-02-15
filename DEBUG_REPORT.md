# Site-wide debug report

**Date:** Generated from full codebase scan.

## Fixes applied

### 1. Auth: safe user id in admin pages
- **Issue:** Admin pages used `(await supabase.auth.getUser()).data.user?.id` for role checks. That can be `undefined` and was duplicated in many files.
- **Fix:** Added `getCurrentUserId(): Promise<string | null>` in `@/lib/auth`. All admin pages (SDS, compliance, invoices, purchase-orders, employees, phone, AI settings, admin dashboard) now call `getCurrentUserId()`, redirect if null, and use the value in `org_members` queries. Single source of truth and no undefined passed to Supabase.

### 2. ESLint: unescaped entities in JSX
- **Issue:** Lint errors for unescaped `'` and `"` in JSX text (react/no-unescaped-entities).
- **Fix:** Escaped apostrophes and quotes in:
  - `src/app/app/dashboard/franchisee/page.tsx` (You're, Here's, what's)
  - `src/app/auth/forgot-password/page.tsx` (we'll)
  - `src/components/search/global-search.tsx` (quotes around query)
  - `src/components/settings/branding-settings.tsx` (organization's)

### 3. ESLint config at project root
- **Issue:** `npm run lint` could prompt for config (no root `.eslintrc`).
- **Fix:** Added `.eslintrc.json` with `"extends": "next/core-web-vitals"` so lint runs non-interactively.

## Build & lint status

- **Build:** `npm run build` — compiles successfully (Next.js 14; type/lint checks skipped in build per `next.config.mjs`).
- **Lint:** `npm run lint` — runs with the new config. Remaining items are **warnings** (see below), not errors.

## Remaining lint warnings (non-blocking)

- **React Hook dependencies:** `useEffect`/`useMemo` dependency arrays in `bid-calculator.tsx`, `inspection-runner.tsx`, `map-content.tsx`, `onboarding-form.tsx`. Consider adding deps or wrapping in `useCallback`/`useMemo` where appropriate.
- **next/image:** `product/[slug]/page.tsx` and `product-card.tsx` use `<img>`. Consider switching to `next/image` for optimization (and possible provider cost).

## What was checked

- **Auth flow:** Login (email + OAuth), logout, landing, after-login, middleware `active_org_id`, onboarding redirects — consistent; no new issues found.
- **Routes:** App routes under `/app/*`, `/franchisor/*`, `/operator/*` exist and match redirects.
- **Links:** Sidebar and in-app links use `/app/...`; no bare `/dashboard` or `/admin` links.
- **API routes:** Return proper JSON and status codes; no empty catch blocks found.
- **TODOs:** Left as-is (AI, email, QuickBooks, etc.) — intentional placeholders.

## Recommendations

1. **TypeScript:** Re-enable type checking in build when ready (`typescript: { ignoreBuildErrors: false }` in `next.config.mjs`) and fix any reported errors.
2. **Lint in CI:** Run `npm run lint` in CI and, if desired, fail on warnings (e.g. `next lint --max-warnings 0`).
3. **Admin pattern:** Any new admin/role-gated page should use `getCurrentUserId()` from `@/lib/auth` for the `user_id` check instead of calling `getUser()` directly.
