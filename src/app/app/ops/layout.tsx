import { requireOrg } from '@/lib/auth';
import { isOperationsEnabled } from '@/lib/is-premium';
import { OperationsUpgradeScreen } from '@/components/app/operations-upgrade-screen';

export const dynamic = 'force-dynamic';

/**
 * Server-side gate: Cub users hitting /app/ops/* see UpgradeScreen instead of 404 or app content.
 */
export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const operationsEnabled = await isOperationsEnabled(org.org_id);

  if (!operationsEnabled) {
    return <OperationsUpgradeScreen />;
  }

  return <>{children}</>;
}
