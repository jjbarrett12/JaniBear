import { redirect } from 'next/navigation';

/**
 * Post-login landing page. Redirects to the API route that sets the org cookie
 * and sends the user to dashboard or onboarding. Keeps cookie logic in a
 * Route Handler to avoid Server Component render errors when setting cookies.
 */
export default function AuthLandingPage() {
  redirect('/api/auth/landing');
}
