# Auth enforcement inventory and diagnosis

## 1) Auth enforcement points (file + what it does + when it runs)

| File | What it does | When it runs |
|------|--------------|--------------|
| **src/middleware.ts** | Calls `updateSession(request)`; on throw returns `NextResponse.next`. | Every request matching matcher (all except static assets). |
| **src/lib/supabase/middleware.ts** | Creates Supabase server client from request cookies; `getUser()`; if no user and path not public → redirect to `/auth/login`; if user and `/app/` and no `active_org_id` cookie → sets that cookie on response; when Supabase calls `setAll` (session refresh) stores cookies on response, does **not** redirect (redirect was removed). | Same request, before layout. |
| **src/app/app/layout.tsx** | Calls `requireOrg()` then renders sidebar + children. `requireOrg()` → `getCurrentUser()` → if no user → `redirect('/auth/login')`. | Every /app/* request (after middleware). |
| **src/lib/auth.ts** | `getCurrentUser()`: server `createClient()`, `getUser()`; null/error → return null. `requireAuth()` / `requireOrg()`: if no user → `redirect('/auth/login')`. | When any server code under /app calls requireOrg/requireAuth/getCurrentUser. |
| **src/lib/user-context.ts** | `getUserContext()`: server `createClient()`, `getUser()`; used by pages for org/role. No redirect; returns null user if not logged in. | When pages/layouts call getUserContext(). |
| **src/app/api/auth/landing/route.ts** | `getUser()`; no user → redirect `/auth/login`; no membership → redirect `/onboarding`; else set `active_org_id` cookie, redirect `/app/dashboard`. | GET /api/auth/landing (after login). |
| **src/app/auth/callback/route.ts** | OAuth code exchange; on error redirect to `/auth/login`. | OAuth callback. |
| **src/app/auth/login/page.tsx** | If `getUser()` has user → redirect `/app/dashboard`. | Load of /auth/login. |
| **src/app/auth/forgot-password/page.tsx** | If user → redirect `/app/dashboard`. | Load of forgot-password. |
| **src/app/auth/continue/auth-continue-client.tsx** | Client: `getSession()` in loop; no session → eventually `window.location.replace('/auth/login?error=session')`. | Only on /auth/continue page. |
| **src/app/operator/layout.tsx** | `getUserContext()`; if !user → redirect `/auth/login`. | Only under /operator. |
| **src/app/franchisor/layout.tsx** | Same for /franchisor. | Only under /franchisor. |
| **Various app/app/admin/*, pro-gear, etc.** | Page-level `getCurrentUserId()` or `getUser()` then `if (!userId) redirect('/auth/login')`. | When those specific pages run. |

**Supabase client usage:**
- **Server (middleware):** `createServerClient` in `src/lib/supabase/middleware.ts` with `request.cookies.getAll` / `setAll` writing to response.
- **Server (layout/pages/API):** `createClient()` from `src/lib/supabase/server.ts` → `createServerClient` with `cookies()` from `next/headers`.
- **Client:** `createClient()` from `src/lib/supabase/client.ts` → `createBrowserClient` (no auth-helpers; only @supabase/ssr in package.json).

No duplicate auth-helpers; single @supabase/ssr pattern.

---

## 2) Session continuity on sidebar navigation

- **Sidebar links:** All `<Link href="..." prefetch={false}>` in `src/components/app/app-sidebar-nav.tsx` (and similar). Client-side navigation, no full reload.
- **Session cookie:** Middleware and layout both read auth from cookies (middleware from `request.cookies`, layout from `cookies()`). Same request should see same cookies unless the request to the layout is a different one (e.g. RSC fetch without Cookie header).
- **Clearing / signOut:** No code clears cookies or calls `signOut()` on route change. `signOut` only in logout route, reset-password success, and onboarding-form.

---

## 3) Conflicting implementations

- **Single Supabase setup:** One server client (server.ts), one browser client (client.ts), one middleware client (middleware.ts). Same env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **No auth-helpers:** Only `@supabase/ssr` in package.json.
- **Double guard:** Middleware redirects unauthenticated users to `/auth/login`. Layout then calls `requireOrg()` → `getCurrentUser()` and **also** redirects to `/auth/login` if no user. So two places can send the user to login; both use the same idea (get user from cookies). Conflict only if they see different cookie state (e.g. middleware sees user, layout does not).

---

## 4) Diagnosis and proof

**Redirect to sign-in happens here:**

- **src/lib/auth.ts** around **lines 82–86** in `requireOrg()`:
  - `const user = await getCurrentUser();`
  - `if (!user) { ... redirect('/auth/login'); }`
- **src/app/app/layout.tsx** line **21**: `const org = await requireOrg();` so when `getCurrentUser()` returns null, `requireOrg()` runs and triggers that redirect.

**Why only after sidebar navigation:**

- Full load of `/app/dashboard`: one request; middleware runs, then layout runs with the **same** request cookies; both see the same session.
- Client-side click to e.g. `/app/settings`: Next.js issues a **new** request (RSC payload or document) for that URL. If that request does not include the Cookie header (known in some Next.js / fetch setups for client-driven RSC requests), then:
  - Middleware runs with **no** cookies → `getUser()` returns null → middleware redirects to `/auth/login`, **or**
  - Middleware runs with cookies (e.g. first request had them), but the **layout** runs in a different invocation (e.g. RSC payload request) that does **not** receive cookies → `cookies()` in layout is empty → `getCurrentUser()` returns null → layout redirects to `/auth/login`.

So the kick to sign-in is from **layout** (`requireOrg` → `getCurrentUser()` null → `redirect('/auth/login')`), and the underlying cause is that on client-side navigation the layout’s request either has no cookies or a session that `getUser()` rejects (e.g. timing/validation).

---

## 5) Route protection flow (debug output)

**User hits /app/dashboard (full load):**
1. Request with Cookie header.
2. **Middleware:** `getUser()` with request cookies → user present → optionally set `active_org_id` → return `NextResponse.next({ request })` (with any Set-Cookie from refresh).
3. **Layout:** `requireOrg()` → `getCurrentUser()` (server `cookies()`) → user present → `getCurrentOrg()` → redirect or render.
4. **Page:** dashboard content.

**User clicks sidebar → e.g. /app/settings (client-side nav):**
1. New request (RSC or document) for /app/settings; Cookie header may or may not be sent depending on Next.js/fetch.
2. **Middleware:** runs for that request; if cookies present, `getUser()` succeeds; if not, redirect to `/auth/login`.
3. **Layout:** runs (same or different request); `requireOrg()` → `getCurrentUser()`. If this request has no cookies or invalid session, `getUser()` returns null → **redirect('/auth/login')** (this is the observed kick).

**Conclusion:** This matches “layout sees no user on client nav” due to cookie/session not available or not valid in the request that runs the layout. Not necessarily “prompt drift,” but two guards (middleware + layout) with the same intent; the layout guard is the one that fires when the layout’s request has no valid session.
