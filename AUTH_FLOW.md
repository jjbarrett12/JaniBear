# JaniBear auth flow

This doc describes the **only** supported sign-in flow. Changing auth (login, middleware, layout) without following this can break sign-in again.

## One path: cookie-based session

- **Session** is stored in **cookies** (Supabase `sb-*` cookies).
- **Active org** is stored in **`active_org_id`** cookie (httpOnly, set after login or when entering `/app/`).
- **No** Server Actions for sign-in. **No** client-side redirect after submit.

## 1. Password login

1. User submits the **form** on `/auth/login` with `action="/api/auth/login"` and `method="POST"`.
2. **POST /api/auth/login** (Route Handler):
   - Reads `email` / `password` from form body.
   - Calls `supabase.auth.signInWithPassword()`.
   - Sets **session cookies** on the **same response** that does the redirect (no second hop).
   - Redirects to **GET /api/auth/landing** (302).
3. **GET /api/auth/landing** (Route Handler):
   - Uses server Supabase client (reads cookies from the request).
   - If no user → redirect to `/auth/login`.
   - If user has no org → redirect to `/onboarding`.
   - Otherwise sets **`active_org_id`** cookie and redirects to **/app/dashboard**.

## 2. OAuth (Google, Facebook)

1. User clicks “Continue with Google” etc. Client calls `signInWithOAuth()` and goes to provider.
2. Provider redirects to **GET /auth/callback?code=...**.
3. **GET /auth/callback** (Route Handler):
   - Exchanges `code` for session via `exchangeCodeForSession()`.
   - Sets session cookies on the response.
   - Redirects to **/api/auth/landing** (or `?next=` for reset-password etc.).
4. Same as password flow from **/api/auth/landing** (set org cookie → dashboard or onboarding).

## 3. Middleware (`src/lib/supabase/middleware.ts`)

- Runs on **every** request (except static assets).
- Creates Supabase client with `getAll` / `setAll` from **request** / **response** cookies.
- Calls **`getUser()`** (validates session with Supabase; do **not** use `getSession()`).
- **Public paths** (`/auth`, `/api`, `/onboarding`, etc.): no redirect.
- **Protected paths** (e.g. `/app/*`): if no user → redirect to `/auth/login`.
- When entering **/app/** without **`active_org_id`**: loads first org membership and sets the cookie on the response.
- If middleware **wrote any cookies** (session refresh or `active_org_id`) for an **/app/** request, it **redirects to the same URL** so the next request has those cookies. Otherwise the app layout would see the old request and redirect to login.

## 4. App layout (`src/app/app/layout.tsx`)

- Calls **`requireOrg()`** (in `src/lib/auth.ts`).
- **requireOrg()**: `getCurrentUser()` then `getCurrentOrg()`. If no user → redirect `/auth/login`. If no org → redirect `/api/auth/landing` (which sets org cookie and sends to dashboard or onboarding).
- Uses **`getUser()`** in server client (same as middleware). **`dynamic = 'force-dynamic'`** so the layout always runs with the current request.

## 5. Server Supabase client (`src/lib/supabase/server.ts`)

- Uses **`cookies()`** from `next/headers` for `getAll` / `setAll`.
- **setAll** in Server Components can throw; it’s caught and ignored. Session refresh is done in **middleware** and via **redirect-to-self** when cookies are set.

## Rules to avoid breaking auth again

1. **Login**: Keep it a **plain form POST** to **/api/auth/login**. No client-side `fetch` + redirect for password submit.
2. **Session**: Set session cookies only in **Route Handlers** (login, callback) or **middleware** (refresh). Never rely on setting cookies in Server Component layout.
3. **Middleware**: If it sets cookies for `/app/*`, it must **redirect to the same URL** so the next request has them; do not try to “forward” cookies onto the request object in a fragile way.
4. **Protected routes**: Only middleware and `requireOrg()` / `getCurrentUser()` should send users to `/auth/login` or `/api/auth/landing`. Use **`getUser()`**, not **`getSession()`**, for checks.
5. **GET/POST**: **/api/auth/login** supports GET (redirect to `/auth/login`). **/api/auth/landing** supports GET and POST (same behavior). Avoids 405 when something hits the wrong method.
