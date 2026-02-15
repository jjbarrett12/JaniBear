import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SDSUploadForm } from '@/components/admin/sds-upload-form';

export default async function NewSDSPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/app/admin/sds"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Back to SDS list"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add SDS document</h1>
          <p className="text-muted-foreground">Upload a Safety Data Sheet for a chemical or product</p>
        </div>
      </div>

      <SDSUploadForm orgId={org.org_id} redirectToEdit />
    </div>
  );
}