# Supabase: What to Do (Short Version)

So **login** and **forgot password** work on your live Janibear site, do this once in Supabase.

---

## Your URLs (fill these in once)

Replace `YOUR-DOMAIN.com` with your real site (e.g. `janibear.com` or `app.janibear.com`).

| What | Value |
|------|--------|
| **Site URL** | `https://YOUR-DOMAIN.com` |
| **Redirect 1** | `https://YOUR-DOMAIN.com/auth/callback` |
| **Redirect 2** | `https://YOUR-DOMAIN.com/auth/reset-password` |

No trailing slash. No space at the end.

---

## Steps in Supabase

1. **Open:** [supabase.com/dashboard](https://supabase.com/dashboard) → open your **Janibear** project.

2. **Go to auth URLs:**  
   Left sidebar → **Authentication** → **URL Configuration**  
   (If you don’t see “URL Configuration”, look under **Authentication** for “URLs” or “Redirect URLs”.)

3. **Site URL**  
   Set the field to: `https://YOUR-DOMAIN.com`

4. **Redirect URLs**  
   Add these two (one per line or via “Add URL”):
   - `https://YOUR-DOMAIN.com/auth/callback`
   - `https://YOUR-DOMAIN.com/auth/reset-password`

5. **Save** the page.

---

## Pin your app to one URL (recommended)

If you use more than one URL (e.g. `janibear.com`, `www.janibear.com`, or a Vercel preview URL), set **one** canonical URL in your app so auth always uses it.

In `.env.local` (and in your host’s env vars, e.g. Vercel):

```env
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN.com
```

Use the **exact** URL you put in Supabase (no trailing slash). Then in Supabase you only need that one domain in Site URL and Redirect URLs.

---

## URL still not working?

**1. Match exactly**  
Supabase compares redirect URLs character-for-character.  
- `https://janibear.com` ≠ `https://www.janibear.com`  
- `https://...` ≠ `http://...`  
- No trailing slash: use `https://janibear.com`, not `https://janibear.com/`

**2. Add every URL you use**  
If users open the app at both `https://janibear.com` and `https://www.janibear.com`, add **both** in Redirect URLs:
- `https://janibear.com/auth/callback`
- `https://janibear.com/auth/reset-password`
- `https://www.janibear.com/auth/callback`
- `https://www.janibear.com/auth/reset-password`  

Or set `NEXT_PUBLIC_APP_URL=https://janibear.com` so the app always tells Supabase to use that URL (then you only need the janibear.com entries in Supabase).

**3. Redeploy after env changes**  
If you add or change `NEXT_PUBLIC_APP_URL`, rebuild and redeploy so the new value is used.

**4. Check Supabase Auth logs**  
In Supabase: **Authentication** → **Logs**. Look for failed sign-ins or “redirect URL not allowed” type errors to see the exact URL Supabase is rejecting.

**5. Test with the exact URL in Supabase**  
Open your app by typing the **same** URL you set as Site URL (e.g. `https://janibear.com`). Sign up or request a password reset. If it works there but not when you use a different URL (e.g. `www` or a preview URL), add that URL to Redirect URLs or use `NEXT_PUBLIC_APP_URL` as above.

---

## Quick checklist

- [ ] Site URL = `https://` + your domain, no slash at end  
- [ ] Redirect URLs include `/auth/callback` and `/auth/reset-password`  
- [ ] Saved in Supabase  
- [ ] (Optional) `NEXT_PUBLIC_APP_URL` set to that same URL and app redeployed
