import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * /auth/admin — redirect to app admin or login.
 * Use this URL when you want "admin" in the path; the actual admin UI lives at /app/admin.
 */
export default async function AuthAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/app/admin');
  }
  redirect('/auth/login?next=' + encodeURIComponent('/app/admin'));
}
