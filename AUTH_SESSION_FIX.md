# Auth session fix: client-side navigation kicking to login

## Most likely causes (ranked)

1. **Same-URL redirect after session refresh in middleware (root cause)**  
   When Supabase refreshed the session in middleware (`setAll` called), we redirected to the same URL so the layout would see new cookies on the “next” request. That redirect causes client-side navigation (RSC fetch) to sometimes lose the session: the follow-up request may not send or receive cookies correctly, so the next run sees no user and redirects to login.

2. **Middleware redirect-on-cookie-write + copying cookies without options (earlier cause)**  
   When middleware set any cookies (session refresh **or** `active_org_id`), it used to redirect and copy cookies without options, dropping `path`, `secure`, `sameSite`, `maxAge`, etc. That was fixed by copying with options; the remaining issue was the redirect itself (see 1).

3. **Layout/server sees “no user” after bad redirect**  
   After the redirect, the next request’s cookies can be wrong or missing, so `requireOrg()` → `getCurrentUser()` gets no user and calls `redirect('/auth/login')`. The kick to login is from the layout, but the cause is the middleware redirect.

4. **Prefetch requests**  
   Prefetch was already skipped (`isPrefetch` early return), so not the cause.

5. **RLS / “not authorized”**  
   No evidence RLS was interpreted as “not logged in”; guards use `getUser()` and redirect only when user is null.

---

## What the logs showed (how to confirm)

With `NEXT_PUBLIC_AUTH_DEBUG=1` in `.env.local` (dev only):

- **Middleware** logs for `/app/*`: `[auth middleware] app route` with `pathname`, `userId`, `didSetAuthCookies`, `authCookieCount`, `authCookies`.  
  If you see `no user, redirect to login` with `authCookieCount: 0`, the request had no auth cookies (e.g. lost after a redirect). After the fix we no longer redirect on refresh; you may see `auth refresh (no redirect)` when Supabase refreshes.
- **Layout** (server): `[auth getCurrentUser]` with `userId`, `error`, `authCookieCount`, `authCookies`. If the layout sees no user, this runs before `redirect('/auth/login')` and shows which cookies the server saw.

---

## Patch

### 1. `src/lib/supabase/middleware.ts`

- **Do not redirect when Supabase refreshes the session**  
  When `didSetAuthCookies` is true (Supabase called `setAll`), return `NextResponse.next()` with the cookies already set on the response instead of redirecting to the same URL. The layout runs in the same request with the incoming cookies; Supabase refreshes proactively before expiry, so `getUser()` in the layout typically still succeeds. This avoids the redirect-based cookie sync issues on client-side navigation.
- **Only set `active_org_id` without redirect**  
  (Already in place.) When we only set `active_org_id`, we do not redirect.
- **Dev-only logs**  
  When `NODE_ENV === 'development'` and `NEXT_PUBLIC_AUTH_DEBUG === '1'`, log pathname, user id, `didSetAuthCookies`, auth cookie count/names for /app routes, and `auth refresh (no redirect)` when we skip the redirect.

### 2. `src/lib/auth.ts`

- **Dev-only log**  
  When `NEXT_PUBLIC_AUTH_DEBUG === '1'`, log `[auth getCurrentUser]` with `userId`, `error`, `authCookieCount`, and `authCookies` so you can see what the layout sees before any redirect.

### No changes to

- Layout guards: still `requireOrg()` → `getCurrentUser()` → redirect if no user (correct).
- Server/client Supabase usage: server uses `createServerClient` with `cookies()`; client uses `createBrowserClient` (no change).
- Matcher: still covers all non-static routes (correct).

---

## Regression checklist

- [ ] **Middleware**  
  - Do **not** redirect to the same URL when `didSetAuthCookies` is true. Return `NextResponse.next()` with cookies set on the response so client-side navigation never hits a redirect that can lose cookies.
  - When setting auth cookies in middleware, set them with full **options** (path, secure, sameSite, etc.) on the response.

- [ ] **Cookie handling**  
  - Do not use `response.cookies.getAll()` and then `set(name, value)` only; that loses options and can break session.

- [ ] **active_org_id**  
  - Setting `active_org_id` in middleware must **not** trigger a same-URL redirect.

- [ ] **Dev instrumentation**  
  - Optional: keep `NEXT_PUBLIC_AUTH_DEBUG=1` and middleware/auth logs for future debugging.

- [ ] **Smoke test**  
  - Log in, land on `/app/dashboard`, then click several sidebar links (client-side navigation). You should stay in /app and not be sent to /auth/login.
