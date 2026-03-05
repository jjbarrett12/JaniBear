# Auth Redirect Loop — Root Cause and Patch

## 1) Redirect chain (observed)

From login → app → back to login:

| Step | Request | Response | Decision point |
|------|---------|----------|----------------|
| 1 | `POST /api/auth/login` (email, password) | `302 /auth/continue?next=/api/auth/landing` + `Set-Cookie` (sb-* session) | Login route: signIn succeeds, redirect to continue |
| 2 | `GET /auth/continue?next=/api/auth/landing` | **Before fix:** `302 /api/auth/landing` (server redirect) | Continue page: `getUser()` saw user → `redirect(next)` |
| 3 | `GET /api/auth/landing` | `302 /api/auth/clear-session?next=/auth/login` | Landing: `getUser()` returned **null** (no session) |
| 4 | `GET /api/auth/clear-session?next=...` | `302 /auth/login` + clear cookies | Clear-session clears sb-* and active_org_id |
| 5 | `GET /auth/login` | 200 login form | User sees login again |

**Alternate path (already-signed-in):**

| Step | Request | Response | Decision point |
|------|---------|----------|----------------|
| 1 | `GET /auth/login` (with existing session cookie) | 200 + "You're already signed in" (LoginAlreadySignedIn) | Login page: `getUser()` saw user |
| 2 | Client: `window.location = /app/dashboard` | — | LoginAlreadySignedIn redirects to app |
| 3 | `GET /app/dashboard` | 200 or `302 /auth/login` | Middleware/layout: if cookies not seen → redirect login |

So there are two loop sources:

- **Post–password-login:** Continue does a **server** redirect to `/api/auth/landing`. The browser follows that 302 **before** it has committed the `Set-Cookie` from step 1, so the request to landing often has **no Cookie** header → landing sees no user → clear-session → login.
- **Already-signed-in:** Login page sees user (server has cookies), client sends user to `/app/dashboard`; if middleware or layout does not see the same cookies (e.g. Edge vs Node, or `cookies()` empty on RSC), layout redirects to login.

## 2) Cookie findings

- **Login route** sets session via `createServerClient` with `request.cookies` and `setAll` writing to `successRedirect.cookies` with `path: '/'` — correct.
- **Middleware** uses `getCookiesForRequest(request)` (request.cookies + Cookie header fallback) and `createServerClient` — correct. Session refresh `setAll` now explicitly sets `path: '/'` on every cookie.
- **Landing route** uses `getCookiesFromRequest(request)` (request + Cookie header) and `createServerClient` — correct. The problem was not landing’s cookie read; it was that the **request** to landing often had no cookies when that request was the immediate follow-up to a 302 from continue.
- **Server `createClient()`** (pages/layouts) uses `cookies()` from `next/headers` and Cookie header fallback — can be empty on some RSC/Edge runs; layout also relies on `x-middleware-user-id` when middleware sees the session.
- **Vercel/Edge:** On a 302 chain, the browser may not yet attach the `Set-Cookie` from the first response to the next request; the “next request” is the one that hits landing, so landing gets no session.

## 3) Root cause (one sentence)

**The continue page did a server-side `redirect(next)` to `/api/auth/landing`, so the browser followed that 302 in the same redirect chain before committing the session cookies from the login response, and the landing request arrived with no session cookie and redirected to clear-session → login.**

## 4) Patch plan and code

### Files to change

| File | Change |
|------|--------|
| `src/app/auth/continue/page.tsx` | Never server-redirect when `next` is `/api/auth/landing`; always render `AuthContinueClient` so the client performs a full navigation to landing after cookies are committed. |
| `src/lib/supabase/middleware.ts` | (1) Gate debug logs with `DEBUG_AUTH`; (2) Ensure session refresh `setAll` sets `path: '/'` on every cookie. |
| `src/app/api/auth/login/route.ts` | Add DEBUG_AUTH log when signIn succeeds and redirect is returned (Set-Cookie count). |
| `src/app/api/auth/landing/route.ts` | Add DEBUG_AUTH to GUARD_DEBUG; log hasUser and sb cookie count. |
| `src/app/auth/login/page.tsx` | Add DEBUG_AUTH log when page sees user (already signed in). |

### 4.1) Continue page — never server-redirect to landing

**File:** `src/app/auth/continue/page.tsx`

- Remove server `redirect(next)` when `next.startsWith('/api/auth/landing')`.
- In that case always return `<AuthContinueClient defaultNext={next} />` so the browser gets a 200, commits cookies, then the client does `window.location.replace(defaultNext)` and the request to landing is a new navigation with cookies.
- Optional: for other `next` (e.g. `/app/dashboard`) when user is already present, server redirect is safe; keep it only when `next` is not landing.

### 4.2) Middleware — path and debug

**File:** `src/lib/supabase/middleware.ts`

- In `setAll`, set every cookie with `{ ...options, path: '/' }`.
- Use `DEBUG_AUTH` (or existing `AUTH_DEBUG` / `GUARD_DEBUG`) so logs are gated (no tokens).

### 4.3) Login route — debug only

**File:** `src/app/api/auth/login/route.ts`

- After setting cookies and before `return successRedirect`, if `DEBUG_AUTH`: log that signIn succeeded and redirect URL / Set-Cookie count (do not log tokens).

### 4.4) Landing route — debug only

**File:** `src/app/api/auth/landing/route.ts`

- Include `DEBUG_AUTH` in the guard/debug condition.
- After `getUser()`, if debug: log `hasUser` and number of `sb-*` cookies on the request.

### 4.5) Login page — debug only

**File:** `src/app/auth/login/page.tsx`

- After `getUser()`, if `DEBUG_AUTH`: log whether user is present (already signed in).

### 4.6) Server client and protected layout

- **Server client** (`src/lib/supabase/server.ts`): Already uses `cookies()` + Cookie header fallback; no change.
- **Protected layout** (`src/app/app/layout.tsx`): Uses `requireOrg()` which uses `getCurrentUser()` and `x-middleware-user-id`; no change. Middleware already sets `x-middleware-user-id` when it sees a session and forwards cookies with `path: '/'`.

## 5) Verification

### Manual steps

1. **Password login → app (no loop)**  
   - Clear cookies for the site (or use incognito).  
   - Go to `/auth/login`, enter email/password, submit.  
   - Expect: redirect to `/auth/continue` → brief “Signing you in…” → redirect to `/api/auth/landing` → redirect to `/app/dashboard` (or onboarding).  
   - You must **not** end up back on `/auth/login` or see “you’re already logged in” then get kicked out.

2. **Already signed in**  
   - With a valid session cookie, open `/auth/login`.  
   - Expect: “You’re already signed in” then redirect to `/app/dashboard` (or requested path).  
   - You must **not** be redirected to clear-session and then back to the login form.

3. **Cookies**  
   - After step 1, open DevTools → Application → Cookies.  
   - Confirm `sb-*` and `active_org_id` are present, path=/, and (in prod) Secure and SameSite=Lax.  
   - Reload `/app/dashboard` and confirm you stay in the app.

### Debug logs (optional)

- Set `DEBUG_AUTH=1` (or `NEXT_PUBLIC_AUTH_DEBUG=1`) in `.env.local` and repeat the flows.  
- Check server logs for `[AUTH_DEBUG]` and `[GUARD]`: continue should show `hasUser`, landing should show `hasUser: true` and `sbCookieCount > 0` on the successful path.

### Automated tests (2)

1. **E2E: password login reaches dashboard**  
   - Playwright: go to `/auth/login`, fill email/password, submit.  
   - Wait for URL to match `/app/dashboard` or `/onboarding` (or similar success route).  
   - Assert no redirect back to `/auth/login` within 15s.

2. **E2E: already-signed-in redirect**  
   - With a session cookie set (or login in same browser context), navigate to `/auth/login`.  
   - Expect URL to change to `/app/dashboard` (or similar) without visiting `/auth/login` again after the redirect.

---

**Summary:** The fix is to stop server-redirecting from `/auth/continue` to `/api/auth/landing` and always use the client to navigate to landing after the continue page loads, so the session cookie is committed before the landing request. Middleware and landing already read cookies correctly; the loop was caused by the redirect chain timing, not by wrong cookie domain/path or multiple Supabase clients.
