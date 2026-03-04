# QuickBooks connection – setup guide

This guide makes it simple to turn on QuickBooks for your customers so you can sell the integration with confidence.

---

## What the customer sees (super simple)

1. They go to **Financial Health** in the app.
2. If QuickBooks isn’t connected, they see a short **“Connect QuickBooks”** card with three steps and one button.
3. They click **“Connect to QuickBooks”** → they’re sent to Intuit to sign in and approve.
4. They’re sent back to Financial Health with **“QuickBooks is connected”** and the **“Accounting Sync: Connected to QuickBooks”** badge.

No forms, no keys, no technical steps for the customer.

---

## What you need to do once (developer setup)

### 1. Create an Intuit Developer app

1. Go to [developer.intuit.com](https://developer.intuit.com) and sign in (or create an Intuit Developer account).
2. **Create an app** → choose **QuickBooks Online** (or “Accounting”).
3. In the app’s **Keys & credentials** (or “Keys and OAuth”):
   - Copy the **Client ID** and **Client Secret**.
   - Under **Redirect URIs**, add exactly:
     - Production: `https://your-production-domain.com/api/integrations/quickbooks/callback`
     - Development: `http://localhost:3000/api/integrations/quickbooks/callback` (or your dev URL).
   - Save. The redirect URI must match exactly what your app uses (including `http` vs `https` and no trailing slash).

### 2. Set environment variables

On the server (or in Vercel/host env), set:

- **`QUICKBOOKS_CLIENT_ID`** = your app’s Client ID  
- **`QUICKBOOKS_CLIENT_SECRET`** = your app’s Client Secret  

Optional:

- **`QUICKBOOKS_REDIRECT_URI`** – Only if you need a different callback URL than `{origin}/api/integrations/quickbooks/callback`.
- **`QUICKBOOKS_SANDBOX`** – Set to `true` to use Intuit’s sandbox (development) if you use different keys for sandbox.

### 3. Deploy and test

1. Deploy with the env vars set.
2. Log in as a user that has **Finance** and permission to connect (e.g. op_finance, op_admin, fr_finance, fr_admin).
3. Open **Financial Health** → you should see the “Connect QuickBooks” card.
4. Click **Connect to QuickBooks** → you should be sent to Intuit, then back to Financial Health with “QuickBooks is connected”.

If something fails, the customer is redirected back with an error message in the URL; you can improve that message in the callback route if needed.

---

## How it works under the hood

- **Connect:** `GET /api/integrations/quickbooks/connect` checks the user’s org and permissions, then redirects to Intuit’s OAuth page with `state=org_id`.
- **Callback:** Intuit sends the user back to `/api/integrations/quickbooks/callback` with `code` and `state`. The server exchanges the code for access and refresh tokens and stores them in `integration_tokens` (and sets `integrations.status = 'connected'`). Then it redirects to `/app/financial-health?qb=connected`.
- **Status:** The Financial Health page calls `GET /api/integrations/quickbooks/status` to show “Connected” or “Not connected” and to show or hide the Connect card.

No customer secrets, no copy‑paste of keys; they only sign in with Intuit and approve.

---

## Permissions

- Only orgs with the **Finance** module can see the Connect option.
- Only users with a role that can connect QuickBooks (e.g. op_finance, op_admin, fr_finance, fr_admin) can complete the flow; others get 403 from the connect API.

---

## Next steps after connection

- **Sync:** The route `POST /api/integrations/quickbooks/sync/invoices` is still a stub. When you’re ready, implement it using the stored `access_token` and `realm_id` (in `integration_tokens.metadata` / `integrations.metadata`) to pull invoices or other data from QuickBooks.
- **Refresh:** Access tokens expire in about an hour. Before calling QuickBooks APIs, check `expires_at` and use the refresh token to get a new access token (Intuit token endpoint with `grant_type=refresh_token`).

Once the app is created and env vars are set, the customer experience is just: open Financial Health → click Connect → sign in with QuickBooks → done.
