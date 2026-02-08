# Launch JaniBear on janibear.com

Use this checklist to get **janibear.com** live and to keep using it as your main site (instead of localhost).

---

## One-time setup

### 1. Vercel project and GitHub

- Create or open your Vercel project: [vercel.com/dashboard](https://vercel.com/dashboard)
- Connect the project to your **GitHub** repo (the one that has this JaniBear code)
- Set **Production Branch** to `main` (Settings → Git)

### 2. Add janibear.com in Vercel

- In the project: **Settings → Domains**
- Click **Add** and enter: `janibear.com`
- Add `www.janibear.com` too if you want www to work
- Vercel will show the **DNS records** you need

### 3. Point DNS to Vercel

- Log in where you **own** janibear.com (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.)
- Open **DNS** or **DNS Management**
- Add the records Vercel shows, for example:
  - **A** record: `76.76.21.21` (or the IP Vercel gives you)
  - **CNAME** for `www`: `cname.vercel-dns.com` (or what Vercel shows)
- Save and wait 5–60 minutes, then in Vercel click **Verify** on the domain until it shows as verified

### 4. Environment variables in Vercel

- **Settings → Environment Variables**
- Add (for **Production**, and optionally Preview/Development):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://janibear.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL (e.g. `https://qernccygofbgxlawpohw.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

- Add any Stripe keys and other vars from `.env.local.example` if you use them.
- After changing env vars: **Deployments → … on latest → Redeploy**.

### 5. Supabase auth URLs

- [Supabase Dashboard](https://supabase.com/dashboard) → your JaniBear project
- **Authentication → URL Configuration**
- **Site URL:** `https://janibear.com`
- **Redirect URLs:** add:
  - `https://janibear.com/auth/callback`
  - `https://janibear.com/auth/reset-password`
- Save

### 6. (Optional) Stripe

- If you use Stripe: **Developers → Webhooks → Add endpoint**
- URL: `https://janibear.com/api/webhook`
- Use the signing secret in Vercel as `STRIPE_WEBHOOK_SECRET`

---

## Going forward: use janibear.com, not localhost

- **To put changes live on janibear.com:**  
  Double-click **deploy-easy.bat** (or run `.\deploy-easy.ps1`).  
  That commits, pushes to `main`, and Vercel deploys. In 1–2 minutes the update is at **https://janibear.com**.

- **To test locally first:**  
  Run `npm run dev` and open **http://localhost:3001**.  
  When you’re happy, run the deploy script above to update janibear.com.

- Your app is already configured for janibear.com: **`.env.local`** has `NEXT_PUBLIC_APP_URL=https://janibear.com` (used for auth redirects and links). The same value must be set in **Vercel** (step 4) so production uses janibear.com.

---

## Quick reference

| Goal | Action |
|------|--------|
| Update janibear.com | Double-click **deploy-easy.bat** (or `git push origin main`). Wait 1–2 min, then hard-refresh (Ctrl+Shift+R). |
| Open live site | **https://janibear.com** |
| Open local site | `npm run dev` → **http://localhost:3001** |
| Site not updating | Ensure you pushed to `main`; check Vercel Deployments; hard-refresh or try incognito. |
