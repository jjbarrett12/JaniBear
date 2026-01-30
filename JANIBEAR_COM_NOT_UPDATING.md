# Why janibear.com Isn’t Updating (and How to Fix It)

## Why you don’t see changes

**janibear.com is almost certainly tied to the Vercel project that’s connected to GitHub.**

- **Production** for that project = “latest build from the **main** branch on GitHub.”
- So janibear.com shows whatever was last built **from GitHub**, not from your double‑click or “Deploy” in the Vercel dashboard (those can be other deployments).

If you only:
- Double‑click `deploy.bat`, or  
- Click “Deploy” in Vercel  

but **don’t push your latest code to GitHub**, then the build that janibear.com uses never changes. That’s why the site doesn’t update.

---

## What to do so janibear.com updates

You need to **push your code to the `main` branch on GitHub**.  
Vercel will then build from GitHub and update the deployment that janibear.com uses.

### Option A: Double‑click (recommended)

1. In File Explorer, go to your JaniBear folder.
2. Double‑click **`update-janibear-com.bat`**.
3. If it asks for GitHub login, use your username and a **Personal Access Token** (not your password) if you use 2FA.
4. Wait 2–3 minutes, then hard‑refresh janibear.com (Ctrl+Shift+R).

### Option B: Do it in a terminal

1. Open PowerShell or Command Prompt.
2. Run (PowerShell: use `cd "path"` with no `/d`; CMD: use `cd /d "path"`):
   ```powershell
   cd "C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
   git add -A
   git status
   git commit -m "Update site"
   git branch -M main
   git push -u origin main
   ```
3. Wait 2–3 minutes for Vercel to build from GitHub.
4. Hard‑refresh janibear.com (Ctrl+Shift+R).

---

## Check in Vercel (optional)

1. Go to [vercel.com](https://vercel.com) → your **JaniBear** project.
2. Open **Settings** → **Git** and confirm the repo is connected (e.g. `jjbarrett12/JaniBear`).
3. Open **Deployments**. The top deployment should be from the **main** branch and say “Production.” That’s what janibear.com uses.
4. After you `git push origin main`, a new deployment should appear; when it’s “Ready,” janibear.com will show the new version (after cache refresh).

---

## Summary

| Goal | What to do |
|------|------------|
| **Update janibear.com** | Push to GitHub `main`: use `update-janibear-com.bat` or `git add` → `git commit` → `git push origin main`. Wait 2–3 min, then hard‑refresh. |
| **Not enough** | Double‑click `deploy.bat` or “Deploy” in Vercel alone does **not** update the Production deployment that janibear.com uses if the project is Git‑connected. |

After pushing to `main`, always wait for the new deployment to finish in Vercel, then hard‑refresh (Ctrl+Shift+R) or try an incognito window to avoid cache.
