# Getting localhost:3001 to work (when janibear.com works)

If **janibear.com** works but **localhost:3001** does not, try these in order.

## 1. Use a clean dev server

Clear the Next.js cache and start dev:

```bash
npm run dev:clean
```

Or manually:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Then open **http://localhost:3001**.

## 2. Check `.env.local`

You must have a `.env.local` in the project root with at least:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Use the **same** Supabase project as production (same URL and anon key as in Vercel env vars). If these are missing or wrong, middleware and auth will behave differently on localhost.

## 3. Supabase redirects (production only)

Keep **Supabase** → **Authentication** → **URL Configuration** pointing at **janibear.com** only:

- **Site URL**: `https://janibear.com` (or `http://janibear.com` as you have it)
- **Redirect URLs**: `https://janibear.com/auth/callback`, `https://janibear.com/auth/reset-password`, etc.

Do **not** add `localhost:3001` there if you only care about the live site. Add localhost only if you need to test login/signup locally.

## 4. Restart dev after env changes

If you create or edit `.env.local`, stop the dev server (Ctrl+C) and run `npm run dev` again. Next.js only reads env at startup.

---

**Summary:** Same code runs on Vercel and locally. The usual causes of “prod works, local doesn’t” are a stale `.next` cache, missing/incorrect `.env.local`, or Supabase redirect URLs not including localhost. For janibear.com to update: push to main on GitHub; Vercel deploys. Keep Supabase URLs on janibear.com only. For localhost, use `npm run dev:clean` and `.env.local` with same Supabase keys.
