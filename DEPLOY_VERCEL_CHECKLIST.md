# Vercel deployment checklist

After pushing code, if you don't see changes on janibear.com:

1. **Environment variables**  
   In Vercel: Project → Settings → Environment Variables, set:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key  

2. **Redeploy**  
   Deployments → latest deployment → ⋮ → Redeploy (optionally "Redeploy with existing Build Cache" unchecked to force a clean build).

3. **Branch**  
   Ensure the connected branch is the one you push to (e.g. `main`). Deployments → check "Source" branch.

4. **Cache**  
   Try a hard refresh (Ctrl+Shift+R) or open the site in an incognito/private window to avoid browser cache.

5. **Build logs**  
   If the site doesn’t update, check the latest deployment’s Build Logs for errors.
