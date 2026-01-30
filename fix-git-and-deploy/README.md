# Fix Git & Deploy

Use this folder when git is broken or you need to push changes so Vercel deploys.

---

## Quick: Push changes and deploy

1. Open PowerShell in the **JaniBear** folder (not inside this folder).
2. Run:
   ```powershell
   .\fix-git-and-deploy\push-and-deploy.ps1
   ```
3. If prompted, sign in to GitHub (use a Personal Access Token as password if you use 2FA).
4. Vercel will auto-deploy from the new commit.

---

## If git says "not a git repository"

1. Open PowerShell in the **JaniBear** folder.
2. Run:
   ```powershell
   .\fix-git-and-deploy\fix-git.ps1
   ```
3. Then run:
   ```powershell
   .\fix-git-and-deploy\push-and-deploy.ps1
   ```

---

## Scripts in this folder

| Script | What it does |
|--------|----------------|
| **push-and-deploy.ps1** | `git add .` → commit → push to `main`. Use this to deploy after making changes. |
| **fix-git.ps1** | Removes broken `.git`, runs `git init`, adds remote `origin` → GitHub. Run only if git is broken. |

---

## Manual commands (if you prefer)

**Push and deploy:**
```powershell
cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
git add .
git status
git commit -m "Your message"
git push origin main
```

**Fix git from scratch:**
```powershell
cd "c:\Users\jjbarrett\OneDrive - Bear Facility Supply\Desktop\JaniBear"
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
git init
git remote add origin https://github.com/jjbarrett12/JaniBear.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

---

After you push, check [Vercel](https://vercel.com) for the new deployment (usually 1–2 minutes).
