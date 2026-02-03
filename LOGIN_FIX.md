# Fix Login (Sign-in not taking you to dashboard)

Follow these steps in order. The app is already set up to use cookies correctly with `@supabase/ssr` 0.1.0; the most common causes of failure are Supabase URL config and environment variables.

---

## 1. Supabase Dashboard – URL Configuration

1. Open **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**.
2. Set **Site URL** to:
   - `https://janibear.com` (production)
   - Do **not** use `http://` for production.
3. Under **Redirect URLs**, ensure these are listed (one per line):
   - `https://janibear.com/auth/callback`
   - `https://janibear.com/auth/reset-password`
   - Optionally add: `https://janibear.com/**` to allow all paths on your domain (if your Supabase version supports wildcards).
4. Click **Save**.

---

## 2. Environment Variables

### Local (`.env.local`)

Ensure you have:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get both from: Supabase Dashboard → **Project Settings** → **API** (Project URL and anon/public key).

### Vercel (Production)

1. Vercel project → **Settings** → **Environment Variables**.
2. Add the **same** variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy after changing env vars (or trigger a new deployment).

---

## 3. What the App Already Does (No action needed)

- **Cookie API**: Middleware and server use `get` / `set` / `remove` so `@supabase/ssr` 0.1.0 can read/write the session cookie.
- **Auth handoff**: After sign-in you are sent to `/auth/continue?next=...` so the server can read the cookie and redirect to the dashboard (or onboarding).
- **Delay**: A short delay after sign-in lets the browser persist the cookie before redirecting.

---

## 4. Test Steps

1. Use **Chrome or Edge** (or another modern browser).
2. Open **janibear.com** (or your production URL). Do **not** test only on localhost if production is failing.
3. Go to **Sign In** and enter your email/password.
4. You should see “Signing you in…” then land on the dashboard (or onboarding if you have no org yet).
5. If you still end up back on login:
   - Try an **incognito/private** window (rules out old cookies or extensions).
   - In Supabase Dashboard → **Authentication** → **Users**, confirm your user exists and is **Confirmed** (email verified).
   - In **Authentication** → **Providers** → **Email**, ensure “Confirm email” is set as you expect (e.g. off for testing, or on and then confirm the email).

---

## 5. If It Still Fails – Optional: Upgrade @supabase/ssr

The project uses `@supabase/ssr` **0.1.0**. Newer versions (e.g. 0.5+) may behave better with Next.js App Router and cookies.

To try an upgrade:

```bash
npm install @supabase/ssr@latest
```

Then check the [Supabase Next.js SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs). Newer versions may use `getAll` / `setAll` instead of `get` / `set` / `remove`; if so, the middleware and `src/lib/supabase/server.ts` would need to be updated to match the docs. If you upgrade and see new TypeScript or runtime errors, we can adjust the cookie helpers to match the new API.

---

## 6. Quick Checklist

- [ ] Site URL = `https://janibear.com` (HTTPS)
- [ ] Redirect URLs include `https://janibear.com/auth/callback`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in Vercel and redeployed
- [ ] User exists in Supabase and is confirmed (if email confirmation is on)
- [ ] Tested in incognito once

If all of the above are correct and login still fails, the next step is to add a small debug log (e.g. on `/auth/continue`) to see whether the server sees the session cookie when you land there after sign-in.
