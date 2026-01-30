# How to Deploy JaniBear to Vercel

JaniBear is on Vercel. Your live site is your Vercel URL (e.g. **jani-bear-xxxx.vercel.app** or your custom domain).

To **update** it with new code, use one of the options below. **Option 2** is the easiest: double-click to deploy.

---

## Option 1: Double-click deploy (easiest)

1. **Open File Explorer** (Windows key + E).

2. **Go to your JaniBear folder:**
   - In the address bar, paste this and press Enter:
   ```
   C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear
   ```

3. **Double-click** `deploy.bat`.

4. Wait for the window to finish. When it says **"Press any key to close"**, press any key.

5. **Check your site** in 1–2 minutes (your Vercel URL).

---

## Option 2: Fix git author + deploy (double-click)

If you want to fix the last commit author (e.g. for Vercel) and then deploy:

1. **Open File Explorer** and go to the JaniBear folder (path above).

2. **Double-click** `fix-git-and-deploy.bat`.

3. Wait for it to finish, then press any key to close.

4. **Check your site** in 1–2 minutes.

---

## Option 3: Push to main (GitHub → Vercel auto-deploy)

Vercel deploys automatically when you push to the `main` branch.

1. **Open a terminal** in your project (Cursor’s terminal, or Command Prompt / PowerShell).

2. **Go to your project folder:**
   ```
   cd "C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
   ```

3. **Stage, commit, and push:**
   ```
   git add -A
   git commit -m "Your message"
   git push origin main
   ```

4. **Wait 1–2 minutes.** Vercel will build and deploy from GitHub.

5. **Check your site** (your Vercel URL).

---

## Option 4: Deploy from terminal (Vercel CLI)

1. **Open Command Prompt** (Windows key → type `cmd` → Enter).

2. **Go to your project:**
   ```
   cd /d "C:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
   ```

3. **Deploy:**
   ```
   npx vercel --prod
   ```

4. Wait for it to finish, then check your Vercel URL.

---

## If you see "token not valid" or "login"

1. Run:
   ```
   npx vercel login
   ```
2. Complete login in the browser.
3. Run **Option 1** (double-click `deploy.bat`) or **Option 4, step 3** again.

---

## Summary

| What | How |
|------|-----|
| **Quick deploy** | Double-click `deploy.bat` in the JaniBear folder. |
| **Fix author + deploy** | Double-click `fix-git-and-deploy.bat`. |
| **Push to GitHub** | Use Option 3; Vercel auto-deploys from `main`. |

After any deploy, wait 1–2 minutes, then refresh your live site.
