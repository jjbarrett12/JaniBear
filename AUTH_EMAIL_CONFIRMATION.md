# Disable Email Confirmation (Janibear Auth)

To let users sign in right after signup **without** clicking a confirmation link (and avoid confirmation emails going to spam):

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** and select your project.
2. Go to **Authentication** → **Providers**.
3. Click **Email**.
4. Turn **off** **“Confirm email”**.
5. Save.

After this, new signups can log in immediately with their email and password. No confirmation email is sent.

---

**If you prefer to keep confirmation but reduce spam:** use a custom SMTP provider (Supabase → Project Settings → Auth → SMTP) so emails come from your domain and are less likely to be filtered.
