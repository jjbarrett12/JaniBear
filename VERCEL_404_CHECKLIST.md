# Vercel 404 Fix Checklist

If your deployment shows **Ready** but every URL returns **404 NOT_FOUND**, work through this list in order.

## 1. Vercel Project Settings (Build & Development)

**Path:** Project → **Settings** → **Build and Deployment** (or **Build & Development**)

| Setting | Must be |
|--------|--------|
| **Framework Preset** | **Next.js** (not "Other") |
| **Build Command** | Leave **empty** (use default) or `npm run build` |
| **Output Directory** | Leave **empty** (do **not** override). Next.js uses `.next`; Vercel knows this. If this is set to anything (e.g. `out`, `public`), **clear it**. |
| **Install Command** | Leave **empty** (use default) or `npm install` |
| **Root Directory** | **Empty** if your repo root is the app (folder with `package.json`, `src/`). If the app is in a subfolder (e.g. `JaniBear`), set it to that folder. |

**Critical:** An overridden **Output Directory** (e.g. `out` or `public`) will cause 404 for all routes. Clear it and redeploy.

---

## 2. Deployment Protection

**Path:** Project → **Settings** → **Deployment Protection**

- If **Vercel Authentication** or **Password Protection** is on for Production, visitors must sign in to Vercel to see the site. Turn it **off** for Production (or add an exception) so the public can load the site.
- **Preview** deployments can stay protected if you only need production public.

---

## 3. Environment Variables

**Path:** Project → **Settings** → **Environment Variables**

For Production (and Preview if you use it), set:

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL (e.g. `https://xxxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key

After changing env vars, **Redeploy**: Deployments → ⋮ on latest → **Redeploy**.

---

## 4. Use the Correct URL

- Open **Deployments**, find the latest **Ready** deployment.
- Click it, then click **Visit** (or copy the URL).
- Test **that** URL (e.g. `https://janibear-xxx.vercel.app` or your custom domain).
- If you use a custom domain, ensure it’s added under **Settings** → **Domains** and points to this project.

---

## 5. After Pushing Code

1. Wait for the new deployment to show **Ready**.
2. Test:
   - `https://YOUR_URL/` → homepage
   - `https://YOUR_URL/api/health` → `{"ok":true,"env":true}`

If `/api/health` works but `/` 404s, the app is running and the issue is with the root route. If both 404, the request is not reaching the app (check 1–4 above).

---

## 6. Runtime Logs

**Path:** Open a deployment → **Runtime Logs** (or **Functions**)

- Visit your site, then check logs. If you see **no** logs when you load the page, the request is not reaching your app (wrong URL, deployment protection, or wrong project).
- If you see errors in the logs, fix those (e.g. missing env, runtime error in layout/page).

---

## Summary

Most often, 404 for all routes is caused by:

1. **Output Directory** overridden in Vercel (e.g. `out` or `public`) → clear it.
2. **Framework** set to "Other" instead of **Next.js** → set to Next.js.
3. **Deployment Protection** requiring login → disable for Production or add exception.
4. Using the wrong deployment URL or domain → use **Visit** on the latest Ready deployment.

After changing any of these, **redeploy** and test again.
