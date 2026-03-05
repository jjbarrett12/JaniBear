# Auth Login Regression (March 2026)

## What broke

Around **March 3, 2026**, the merge `353bef9` ("Merge origin/main: resolve conflicts") brought in changes that broke the login flow:

1. **Login form** (`src/components/auth/login-form.tsx`) was changed from a **native form POST** to a **JavaScript `fetch()` + manual redirect**:
   - Before: `<form action="/api/auth/login" method="POST">` — browser submits, gets 302 + Set-Cookie, follows redirect; cookies are committed before the next request.
   - After (merge): `onSubmit` → `fetch('/api/auth/login', { redirect: 'manual' })` → `window.location.href = res.headers.get('Location')`. The client redirect can happen before the browser has committed the session cookies from the fetch response, so the next request (to `/api/auth/landing`) often had no session → landing redirected back to login → loop / throttling / blank page.

2. **Landing** when it didn’t see a user redirected to `/auth/login`; combined with the above, that produced a redirect loop.

## Why native POST matters

With a **native form POST**, the browser:

1. Sends the POST and receives the response (302 + Set-Cookie).
2. Commits the cookies from that response.
3. Follows the `Location` redirect in a new request that **includes** those cookies.

With **fetch + `redirect: 'manual'`**, the app handles the redirect in JS. The timing of when the browser commits `Set-Cookie` from the fetch response vs when `window.location.href` runs can mean the next request is sent without the new session, so the server sees no user.

## Fixes applied

- **Login page** uses a **server-rendered form** with `action="/api/auth/login" method="post"` (no client-side fetch for submit). No `useSearchParams()` on the login page to avoid client deferral and extra navigations.
- **Post-login flow**: successful login redirects to **`/auth/continue?next=/api/auth/landing`** so the browser loads an HTML page and commits cookies before hitting landing; then continue redirects (server or client) to `/api/auth/landing`.
- **Landing** when there is no user redirects to **`/api/auth/clear-session?next=/auth/login`** instead of `/auth/login?session=invalid` to avoid an extra redirect and loop.

## Do not

- Replace the login form’s native POST with `fetch()` + client-side redirect for the main email/password submit.
- Rely on a single redirect from login response directly to `/api/auth/landing` if the client uses fetch; use `/auth/continue` (or another full page load) in between so cookies are committed before landing runs.
