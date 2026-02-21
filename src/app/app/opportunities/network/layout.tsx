import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { resolveShellForOrg, isFranchiseeEnrolled } from '@/lib/shell';

/** Network Opportunities: only franchisee shell AND enrolled (active franchise_associations). */
export default async function NetworkOpportunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const [shell, enrolled] = await Promise.all([
    resolveShellForOrg(org.org_id),
    isFranchiseeEnrolled(org.org_id),
  ]);
  if (shell !== 'franchisee') {
    redirect('/app/dashboard');
  }
  if (!enrolled) {
    redirect('/app/dashboard');
  }
  return <>{children}</>;
}
