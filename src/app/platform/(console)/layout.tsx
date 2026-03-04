import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/platform-guard';
import { PlatformShell } from '@/components/platform/platform-shell';
import { getImpersonateOrgId } from '@/actions/platform';

export default async function PlatformConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  const impersonateOrgId = await getImpersonateOrgId();
  let impersonatingOrgName: string | null = null;
  if (impersonateOrgId) {
    const supabase = await createClient();
    const { data } = await supabase.from('organizations').select('name').eq('id', impersonateOrgId).maybeSingle();
    impersonatingOrgName = data?.name ?? 'Org';
  }
  return <PlatformShell impersonatingOrgName={impersonatingOrgName}>{children}</PlatformShell>;
}
