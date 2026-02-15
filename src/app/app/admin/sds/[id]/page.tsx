import { redirect, notFound } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * SDS detail: redirect to edit page so links like /app/admin/sds/[id] work.
 */
export default async function SDSDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member) {
    redirect('/app/dashboard');
  }

  const { data: sds } = await supabase
    .from('sds_sheets')
    .select('id')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!sds) {
    notFound();
  }

  redirect(`/app/admin/sds/${id}/edit`);
}
