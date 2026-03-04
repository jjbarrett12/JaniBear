# Onboarding & Auth Audit — First 1000 Customers

This document records the debugging audit for sign-in, permissions, and onboarding so the first 1000 customers have a smooth experience. Use it as a checklist before launch and when triaging support issues.

## Fixes Applied (this audit)

### 1. **Signup page crash for new users**
- **Issue:** `/auth/signup` used `.single()` when checking `org_members`. New users have zero memberships, so the query returns no row and `.single()` throws → 500 / crash.
- **Fix:** Switched to `.maybeSingle()` so missing membership is handled and redirect goes to `/onboarding`.

### 2. **“Remember me” did nothing**
- **Issue:** Login form had a “Remember me” checkbox but submitted to `POST /api/auth/login`, which did not read or set the remember-email cookie. Only the unused server action handled it.
- **Fix:** API route now reads `remember_me` from formData and sets/clears `janibear_remember_email` cookie on the success redirect. Login form checkbox uses `name="remember_me"` and `value="1"` so the value is submitted.

### 3. **Logged-in user on login or signup page**
- **Issue:** If a logged-in user hit `/auth/login` or `/auth/signup`, they were sent to `/app/dashboard` with no guarantee `active_org_id` was set (relied on middleware on first /app request).
- **Fix:** Logged-in users are now redirected to `/api/auth/landing`, which sets `active_org_id` and sends them to dashboard or onboarding in one place. Same behavior as after a fresh login. (Signup page: user with org → `/api/auth/landing`; user without org → `/onboarding`.)

### 4. **Onboarding → app without setting org cookie**
- **Issue:** After creating an org, the onboarding form did `window.location.href = '/app/dashboard'`. Cookie was set later by middleware, which could cause a brief “no org” state or redirect jitter.
- **Fix:** Onboarding form now redirects to `/auth/set-org-and-continue?next=/app/dashboard`. That route sets `active_org_id` and redirects in one response, so the first /app request always has the cookie.

### 5. **Redirect safety (OAuth callback and set-org-and-continue)**
- **Issue:** `next` query param could theoretically be abused (e.g. `//evil.com` or path tricks).
- **Fix:** Callback and set-org-and-continue now only accept `next` values that start with `/`, do not contain `//`, and match allowed path prefixes (`/auth/`, `/app/`, etc.).

---

## Auth & onboarding flow (quick reference)

| Step | Where | What happens |
|------|--------|----------------|
| Password login | Form → POST /api/auth/login | signInWithPassword, set session + optional remember_me cookie, redirect to /api/auth/landing |
| OAuth login | Provider → GET /auth/callback?code= | exchangeCodeForSession, set session, redirect to /api/auth/landing (or safe `?next=`) |
| Post-login | GET/POST /api/auth/landing | No user → /auth/login. No org → /onboarding. Else set active_org_id, redirect /app/dashboard |
| App layout | /app/* | requireOrg(); no user → /auth/login; no org → /api/auth/landing |
| Middleware | All non-public | Refresh session; on /app/ without active_org_id, set cookie from first membership |
| New user signup | /auth/signup | If user and no org → /onboarding. If user and org → /api/auth/landing (sets cookie, then /app/dashboard) |
| After onboarding | OnboardingForm submit | Create org + membership, redirect to /auth/set-org-and-continue?next=/app/dashboard (sets cookie, then /app/dashboard) |

See **AUTH_FLOW.md** for full detail.

---

## Permissions & RBAC

- **Org context:** `getUserContext()` / `requireOrg()` use `active_org_id` cookie and fall back to first membership. Used for gating by `org_type`, `role`, `role_enum`, `modules`, and `capabilities`.
- **Franchisor vs operator:** See `.cursor/rules/janibear-os-joint-employer.mdc`. Franchisors never get labor/crew/PII; operators control execution. Use `isFranchisor()` / `isOperator()` and `hasModule()` / `hasCap()` from `user-context.ts`.
- **API guards:** `api-guard.ts` and route-level checks use the same context; ensure new API routes that touch org or permissions call `getUserContext()` and check module/cap/org type.

---

## Pre-launch checklist (reduce first-1000 complaints)

- [ ] **Env:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in production; no missing env on first load.
- [ ] **Email confirmation:** If Supabase “Confirm email” is on, users must click the link before sign-in; login shows “email not confirmed” and resend. See AUTH_EMAIL_CONFIRMATION.md if needed.
- [ ] **Redirect URLs:** Supabase dashboard → Auth → URL Configuration: add production site URL and `/auth/callback` for OAuth and magic links.
- [ ] **Cookies:** SameSite=Lax, Secure in production; `active_org_id` and `janibear_remember_email` path=’/’ so they’re sent on all app requests.
- [ ] **Logout:** /auth/logout clears session and `active_org_id` so next login gets a clean slate.
- [ ] **Onboarding RLS:** New org + org_members + profiles inserts must be allowed for the signed-in user (e.g. first-org creation policies).
- [ ] **Dashboard redirects:** Franchisors → /franchisor; sales rep role → /app/sales-dashboard; others → operator dashboard. All run after requireOrg() so org is always set.

---

## Common support issues to watch

| Symptom | Likely cause | Where to look |
|--------|----------------|----------------|
| “Redirected to login right after signing in” | Session cookie not set or not sent (SameSite, domain, HTTPS) | Callback and /api/auth/login response cookies; middleware cookie fallback (Cookie header parse) |
| “I created my org but then saw onboarding again” | active_org_id not set before first /app request | Use /auth/set-org-and-continue after onboarding (done). If still happens, check middleware and landing route cookie set. |
| “Remember me doesn’t remember my email” | Cookie not set or not read | /api/auth/login remember_me handling; login page defaultEmail from janibear_remember_email |
| “Sign up then 500 or error” | .single() on empty org_members | Fixed with .maybeSingle() on signup page. Any other “first membership” query should use maybeSingle(). |
| “Can’t access [feature]” | Missing module/cap or wrong org_type | getUserContext(); hasModule/hasCap; RLS on the relevant table. |
| “Wrong dashboard after login” | org_type or role_enum not set / wrong | Dashboard page redirects (franchisor, sales rep); org_members.role_enum and organizations.org_type. |

---

## Files touched in this audit

- `src/app/auth/signup/page.tsx` — maybeSingle for org_members; redirect to /api/auth/landing when user has org
- `src/app/auth/login/page.tsx` — redirect to /api/auth/landing when user exists
- `src/app/api/auth/login/route.ts` — remember_me cookie set/clear
- `src/app/auth/callback/route.ts` — safe `next` validation
- `src/app/auth/set-org-and-continue/route.ts` — safe `next` validation
- `src/components/auth/login-form.tsx` — remember_me name/value on checkbox
- `src/components/onboarding/onboarding-form.tsx` — redirect to set-org-and-continue after create

No changes to middleware, requireOrg(), or RLS in this pass; those were audited and left as-is.
