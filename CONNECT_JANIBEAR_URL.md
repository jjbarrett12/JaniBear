# Connect Your Janibear Website Address (Instructions Like You're 5)

This tells the internet: "When someone goes to **your** website address (like janibear.com), show them the Janibear app."

You do it in a few places. One step at a time.

---

## Part 1: Tell Supabase Your Website Address

Supabase is where your app keeps users and passwords. It needs to know your real website address so "Sign in" and "Reset password" work.

### Step 1: Open Supabase

1. Open your web browser (Chrome, Edge, etc.).
2. Go to: **https://supabase.com/dashboard**
3. Log in if it asks you.
4. Click on your **Janibear** project (the one you use for this app).

### Step 2: Open the Auth Settings

1. On the left side, click **Authentication** (it might have a little person icon).
2. Then click **URL Configuration**.

You’ll see a box that says **Site URL** and a list that says **Redirect URLs**.

### Step 3: Type Your Website Address in "Site URL"

1. Find the box that says **Site URL**.
2. Clear whatever is in there.
3. Type your Janibear address **exactly** like this (use yours, not janibear.com if yours is different):
   - `https://janibear.com`  
   - **OR** if your site is at something like app.janibear.com:  
     `https://app.janibear.com`
4. Do **not** put a slash at the end.  
   - ✅ Good: `https://janibear.com`  
   - ❌ Bad: `https://janibear.com/`

### Step 4: Add Two Redirect Addresses

1. Find the part that says **Redirect URLs**.
2. Click **Add URL** (or the place where you can type a new line).
3. Add this **first** line (change janibear.com to your real address):
   ```
   https://janibear.com/auth/callback
   ```
4. Click **Add URL** again and add this **second** line (again use your address):
   ```
   https://janibear.com/auth/reset-password
   ```
5. Click **Save** at the bottom.

Done with Supabase. Login and password reset will now send people back to your Janibear address.

---

## Part 2: Put Your Website on the Internet (Vercel)

If you use **Vercel** to host your site and want people to open it at **janibear.com** (or your domain):

### Step 1: Open Vercel

1. Go to: **https://vercel.com/dashboard**
2. Log in.
3. Click your **Janibear** project.

### Step 2: Add Your Domain

1. Click **Settings** at the top.
2. Click **Domains** in the left menu.
3. Where it says "Add domain", type your address **without** the `https://` part:  
   - Example: `janibear.com` or `app.janibear.com`
4. Click **Add** (or **Verify**).

### Step 3: Do What Vercel Says for DNS

1. Vercel will show you something like "Add this record at your domain provider".
2. Open the website where you **bought** your domain (GoDaddy, Namecheap, Google Domains, etc.).
3. Find the place that says **DNS** or **DNS records**.
4. Add the line Vercel tells you (they’ll show you exactly what to type).
5. Save. Wait 5–10 minutes (sometimes up to an hour). Then go back to Vercel and click **Verify** again.

When it says "Verified", your Janibear address is connected to the app.

---

## Part 3: Optional – Save Your Address in the App

You can tell the app itself what its address is. This is optional.

1. In your Janibear project folder, find the file named **`.env.local`** (if you don’t have it, copy from **`.env.local.example`** and rename the copy to `.env.local`).
2. Open it with Notepad or any text editor.
3. Add a new line (or uncomment the line that’s there):
   ```
   NEXT_PUBLIC_APP_URL=https://janibear.com
   ```
4. Change `https://janibear.com` to **your** real address (same as in Part 1).
5. Save the file.

If you use Vercel, also add this same line in Vercel: **Project → Settings → Environment Variables → Add** → name: `NEXT_PUBLIC_APP_URL`, value: `https://janibear.com` (your URL).

---

## Part 4: Stripe (Only If You Take Payments)

If you use Stripe for payments:

1. Go to: **https://dashboard.stripe.com**
2. Log in.
3. Click **Developers** (top right), then **Webhooks**.
4. Click **Add endpoint**.
5. Where it says "Endpoint URL", type (use your real address):
   ```
   https://janibear.com/api/webhook
   ```
6. Choose the events you need (or the one Stripe suggests for payments).
7. Click **Add endpoint**. Copy the "Signing secret" and put it in your `.env.local` as `STRIPE_WEBHOOK_SECRET` if you haven’t already.

---

## Quick List (What to Do)

1. **Supabase:** Set **Site URL** = your address. Add the two **Redirect URLs**. Save.
2. **Vercel (or your host):** Add your **domain**. Do the **DNS** step they show. Wait and verify.
3. **Optional:** In **`.env.local`** (and in Vercel env), add **`NEXT_PUBLIC_APP_URL`** = your address.
4. **If you use Stripe:** Add **webhook** URL = `https://your-address.com/api/webhook`.

Use the **same** website address everywhere (e.g. always `https://janibear.com` or always `https://app.janibear.com`). Don’t mix them.

When you’re done, open your address in the browser; you should see Janibear and login should work.
