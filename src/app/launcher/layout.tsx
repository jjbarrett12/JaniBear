import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

/**
 * Launcher layout: auth required, no org required.
 * Used for /launcher (workspace picker / multi-org entry).
 * Defensive: never throw — redirect to login on auth failure so route never 404s.
 */
export default async function LauncherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) redirect('/auth/login?next=/launcher');
    return <>{children}</>;
  } catch {
    redirect('/auth/login?next=/launcher');
  }
}
