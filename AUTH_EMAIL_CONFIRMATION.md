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

---

## Google and Facebook login (quick sign-in)

The login page offers **Continue with Google** and **Continue with Facebook**. To enable them:

1. In **Supabase Dashboard** go to **Authentication** → **Providers**.
2. Enable **Google** and/or **Facebook**, and enter the OAuth client ID and secret from [Google Cloud Console](https://console.cloud.google.com/) and [Facebook Developers](https://developers.facebook.com/).
3. In **Authentication** → **URL Configuration**, add your app’s redirect URL:  
   `https://your-domain.com/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).

After that, users can sign in or sign up with Google or Facebook; new users are created automatically and sent through onboarding like email signups.
