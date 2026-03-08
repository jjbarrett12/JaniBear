# Deploy to Vercel Without Using Git

Use this when you don’t want to push to GitHub. Your **local folder** is uploaded and built on Vercel.

## One-time setup

1. **Install Vercel CLI** (if you don’t have it):
   ```bash
   npm i -g vercel
   ```
   Or use it once without installing: `npx vercel --prod`

2. **Log in to Vercel** (first time only):
   ```bash
   cd /Users/jjb/Dev/APPS/JaniBear
   vercel login
   ```
   A browser window opens; log in with your Vercel account (GitHub, email, etc.). After that you’re linked.

3. **Link this folder to your existing JaniBear project** (first time only):
   ```bash
   vercel link
   ```
   Choose your Vercel account → pick the **JaniBear** project → confirm. That’s it.

## Deploy (no Git, no GitHub)

From the project root:

```bash
vercel --prod
```

Or, if you use the npm script:

```bash
npm run deploy:vercel
```

Vercel builds and deploys from your **current files**. No `git add`, no `git push`, no GitHub credentials.

---

**If `npm` or `vercel` isn’t found:** Use a terminal where Node is installed (e.g. after installing from [nodejs.org](https://nodejs.org) or fixing your PATH). Then run the commands above from `/Users/jjb/Dev/APPS/JaniBear`.
