import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { SDSList } from '@/components/admin/sds-list';
import { SDSUploadForm } from '@/components/admin/sds-upload-form';

export default async function SDSPage() {
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

  const { data: sdsSheets } = await supabase
    .from('sds_sheets')
    .select('id, product_name, manufacturer, version, issue_date, expiration_date, document_url, ai_summary, ai_key_hazards, is_active')
    .eq('org_id', org.org_id)
    .eq('is_active', true)
    .order('product_name', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SDS Sheets</h1>
        <p className="text-muted-foreground mt-1">Safety Data Sheets for chemicals and products you use</p>
      </div>

      <SDSUploadForm orgId={org.org_id} />

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Your SDS documents</h2>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/admin/sds/new">
            <FileText className="mr-2 h-4 w-4" />
            Add SDS
          </Link>
        </Button>
      </div>
      <SDSList sdsSheets={sdsSheets ?? []} />
    </div>
  );
}
