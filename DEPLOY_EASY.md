# See JaniBear Changes Easily

Two ways to see your changes: **locally** (instant) or **live** (deployed).

---

## 1. See changes locally (instant)

No deploy needed. Best while you’re editing.

1. Open a terminal in the JaniBear folder.
2. Run:
   ```bash
   npm run dev
   ```
3. Open **http://localhost:3001** in your browser.
4. Edit code and save — the page updates automatically.

---

## 2. See changes live (deployed to Vercel)

Use this when you want to see the same build as production (or share a link).

### Easiest: one script

1. In File Explorer, go to your **JaniBear** folder.
2. **Double-click `deploy-easy.bat`**  
   - Or in a terminal from the JaniBear folder: `npm run deploy` or `.\deploy-easy.ps1`
3. The script will:
   - Commit all current changes (message: `Deploy: date time`)
   - Push to GitHub `main`
   - Vercel will build and deploy in about 1–2 minutes
4. Open your Vercel URL (e.g. from the Vercel dashboard or your custom domain) to see the update.

### Optional: open your live site after deploy

1. In the JaniBear folder, create a file named **`.deploy-url`** (no extension).
2. Put your live URL on a single line, for example:
   ```
   https://janibear.vercel.app
   ```
   or your custom domain.
3. Save the file.
4. Next time you run **deploy-easy.bat** (or **deploy-easy.ps1**), the script will open that URL in your browser a few seconds after pushing.

---

## Summary

| Goal              | What to do                    |
|-------------------|-------------------------------|
| See changes fast  | `npm run dev` → http://localhost:3001 |
| Deploy and see live | Double-click **deploy-easy.bat** or run **`npm run deploy`** |
| Open live URL after deploy | Put your URL in **.deploy-url** (one line) |

For more options (Vercel CLI, fix-git-and-deploy, etc.), see **DEPLOY-STEPS.md**.
