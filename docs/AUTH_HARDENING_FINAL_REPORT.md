# Auth Hardening — Final Report

## 1) Redirect chain after fix

### Password login (success)

| Step | Request | Response | Decision |
|------|---------|----------|----------|
| 1 | `POST /api/auth/login` (email, password) | `302 /auth/continue?next=/api/auth/landing` + Set-Cookie (sb-*) | signIn OK → redirect to continue |
| 2 | `GET /auth/continue?next=/api/auth/landing` | **200** HTML + `<AuthContinueClient defaultNext="/api/auth/landing" />` | `next.startsWith('/api/')` → no server redirect, render client |
| 3 | Client: `window.location.replace('/api/auth/landing')` | — | Browser has committed cookies from step 1 |
| 4 | `GET /api/auth/landing` (with Cookie: sb-*) | `302 /app/dashboard` + Set-Cookie (active_org_id) | getUser() sees user, set org cookie, redirect to app |
| 5 | `GET /app/dashboard` | 200 | User in app |

### Transient missing cookie (no clear-session)

| Step | Request | Response | Decision |
|------|---------|----------|----------|
| 1 | `GET /api/auth/landing` (no Cookie or empty) | `302 /auth/login?reason=missing_cookie` | getUser() null **and** sbCookieCount === 0 → do **not** clear-session |
| 2 | `GET /auth/login?reason=missing_cookie` | 200 + message "Session wasn't ready. Please sign in again." | User can sign in again without having been logged out |

### Invalid/corrupt session (clear-session only when needed)

| Step | Request | Response | Decision |
|------|---------|----------|----------|
| 1 | `GET /api/auth/landing` (Cookie: sb-* present but invalid/expired) | `302 /api/auth/clear-session?next=/auth/login` | getUser() null **and** sbCookieCount > 0 → invalid session → clear-session |

---

## 2) Server logs proving landing sees sb cookies and user

With `DEBUG_AUTH=1` or `NEXT_PUBLIC_AUTH_DEBUG=1` (or `GUARD_DEBUG`):

**Success (cookies committed):**

```
[AUTH_DEBUG] /auth/continue { hasUser: true, next: '/api/auth/landing' }
[AUTH_DEBUG] GET /api/auth/landing { hasUser: true, sbCookieCount: 2 }
[GUARD] landing path=/api/auth/landing session=true org_id=... onboarded=true reason=set cookie redirect=/app/dashboard
```

**Transient miss (no cookies — do not clear):**

```
[AUTH_DEBUG] GET /api/auth/landing { hasUser: false, sbCookieCount: 0 }
[GUARD] landing path=/api/auth/landing session=false sbCookieCount=0 reason=missing_cookie redirect=login
```

**Invalid session (cookies present but bad — clear):**

```
[AUTH_DEBUG] GET /api/auth/landing { hasUser: false, sbCookieCount: 2 }
[GUARD] landing path=/api/auth/landing session=false sbCookieCount=2 reason=invalid_session redirect=clear-session
```

---

## 3) Files changed and exact diffs

### `src/app/auth/continue/page.tsx`

- **Confirm:** Only server-redirects when `next` is a **page** route and user exists. If `next.startsWith('/api/')`, always render client (no server redirect).
- **Add:** `export const dynamic = 'force-dynamic'`.
- **Logic:** Explicit branch: `if (next.startsWith('/api/')) return <AuthContinueClient />`; then `if (user) redirect(next)`; else return client.

```diff
 import { redirect } from 'next/navigation';
 import { createClient } from '@/lib/supabase/server';
 import { AuthContinueClient } from './auth-continue-client';
@@ -14,6 +15,8 @@ function getValidNext(next: string | undefined): string {
   return isValid ? next : DEFAULT_NEXT;
 }
 
+export const dynamic = 'force-dynamic';
+
 export default async function AuthContinuePage({
   searchParams,
 }: {
@@ -22,13 +25,14 @@ export default async function AuthContinuePage({
   const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser();
   if (DEBUG_AUTH) {
     console.log('[AUTH_DEBUG] /auth/continue', { hasUser: !!user, next });
   }
-  if (user && !next.startsWith('/api/auth/landing')) {
+  if (next.startsWith('/api/')) {
+    return <AuthContinueClient defaultNext={next} />;
+  }
+  if (user) {
     redirect(next);
   }
-
   return <AuthContinueClient defaultNext={next} />;
 }
```

### `src/app/api/auth/landing/route.ts`

- **When getUser() is null:** If `sbCookieCount === 0` → redirect to `/auth/login?reason=missing_cookie`. If `sbCookieCount > 0` → redirect to `/api/auth/clear-session?next=/auth/login`.

```diff
   const { data: { user } } = await supabase.auth.getUser();
-  const cookieCount = getCookiesFromRequest(request).filter((c) => c.name.startsWith('sb-')).length;
+  const allCookies = getCookiesFromRequest(request);
+  const sbCookieCount = allCookies.filter((c) => c.name.startsWith('sb-')).length;
   if (GUARD_DEBUG) {
-    console.log('[AUTH_DEBUG] GET /api/auth/landing', { hasUser: !!user, sbCookieCount: cookieCount });
+    console.log('[AUTH_DEBUG] GET /api/auth/landing', { hasUser: !!user, sbCookieCount });
   }
 
   if (!user) {
-    if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=false reason=no user redirect=clear-session');
-    return NextResponse.redirect(new URL('/api/auth/clear-session?next=/auth/login', request.url));
+    if (sbCookieCount === 0) {
+      if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=false sbCookieCount=0 reason=missing_cookie redirect=login');
+      return NextResponse.redirect(new URL('/auth/login?reason=missing_cookie', request.url));
+    }
+    if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=false sbCookieCount=' + sbCookieCount + ' reason=invalid_session redirect=clear-session');
+    return NextResponse.redirect(new URL('/api/auth/clear-session?next=/auth/login', request.url));
   }
```

### `src/app/auth/login/page.tsx`

- **SearchParams type:** Add `reason?: string`.
- **urlError:** When `params.reason === 'missing_cookie'` (or `params.error === 'missing_cookie'`) show "Session wasn't ready. Please sign in again."

```diff
-  searchParams: Promise<{ redirect?: string; next?: string; session?: string; error?: string }>;
+  searchParams: Promise<{ redirect?: string; next?: string; session?: string; error?: string; reason?: string }>;
...
   const urlError =
     params.error === 'session'
       ? 'Session could not be established. Please sign in again.'
+      : params.reason === 'missing_cookie' || params.error === 'missing_cookie'
+        ? 'Session wasn\'t ready. Please sign in again.'
       : params.error === 'invalid'
         ? ...
```

### `e2e/auth-redirect.e2e.ts` (new file)

- **Test 1:** Password login reaches `/app/dashboard` (or `/app/` or `/onboarding`) without returning to `/auth/login` (wait up to 20s for success URL).
- **Test 2:** After logging in, visit `/auth/login`; assert final URL is `/app/dashboard` (or `/app/`) and no request was made to `/api/auth/clear-session`.
- **Note:** Tests use `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD` or default `salesrep@janibear.test` / `Password123!`. Run `npm run seed:test` first so the test user exists.

### Dynamic / no-store

- **Already present:** `src/app/auth/login/page.tsx` has `export const dynamic = 'force-dynamic'`. `src/app/app/layout.tsx` has `export const dynamic = 'force-dynamic'` and `revalidate = 0`.
- **Added:** `src/app/auth/continue/page.tsx` now has `export const dynamic = 'force-dynamic'`.

---

## 4) Summary

| Item | Status |
|------|--------|
| /auth/continue only server-redirects when next is a page route and user exists | Done: `next.startsWith('/api/')` → always client |
| If next starts with /api/, render client and client navigates | Done |
| Landing: no clear-session when getUser() null and sb count 0 | Done: redirect to /auth/login?reason=missing_cookie |
| Landing: clear-session only when sb count > 0 and user null | Done |
| Auth gates force-dynamic | Done: continue + login + app layout |
| Playwright: password login reaches dashboard without loop | Done: `e2e/auth-redirect.e2e.ts` |
| Playwright: already signed-in at login ends at dashboard, never clear-session | Done: request listener asserts no clear-session |

No auto-logout on a transient missing-cookie request: landing only redirects to clear-session when there are sb-* cookies but no valid user (invalid/expired/corrupt). When there are no sb-* cookies, we redirect to login with `reason=missing_cookie` and show a soft message.
