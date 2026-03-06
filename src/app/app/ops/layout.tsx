import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { isOperationsEnabled } from '@/lib/is-premium';
import { OperationsUpgradeScreen } from '@/components/app/operations-upgrade-screen';

export const dynamic = 'force-dynamic';

/**
 * Server-side gate: Cub users hitting /app/ops/* see UpgradeScreen. Platform admins always have access.
 */
export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const operationsEnabled = await isOperationsEnabled(org.org_id, userId);

  if (!operationsEnabled) {
    return <OperationsUpgradeScreen />;
  }

  return <>{children}</>;
}
