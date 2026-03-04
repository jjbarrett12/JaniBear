import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { resolveShellForOrg } from '@/lib/shell';

/** Only franchisor shell can access /app/franchise/*. */
export default async function FranchiseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const shell = await resolveShellForOrg(org.org_id);
  if (shell !== 'franchisor') {
    redirect('/app/dashboard');
  }
  return <>{children}</>;
}
