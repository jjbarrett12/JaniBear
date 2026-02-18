import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';

/** Redirect legacy location edit to facility edit or account edit. */
export default async function LegacyLocationEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: facility } = await supabase
    .from('facilities')
    .select('account_id')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (facility) {
    redirect(`/app/accounts/${facility.account_id}/facilities/${id}/edit`);
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (account) {
    redirect(`/app/accounts/${id}/edit`);
  }

  redirect('/app/accounts');
}
