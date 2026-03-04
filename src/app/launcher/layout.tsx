import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

/**
 * Launcher layout: auth required, no org required.
 * Used for /launcher (workspace picker / multi-org entry).
 */
export default async function LauncherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/launcher');
  return <>{children}</>;
}
