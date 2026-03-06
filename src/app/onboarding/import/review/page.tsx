import { ImportReviewClient } from '@/components/onboarding-import/ImportReviewClient';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';

export const dynamic = 'force-dynamic';

export default async function ImportReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string }>;
}) {
  const params = await searchParams;
  const batchId = params.batchId ?? '';
  const orgId = await getActiveOrgIdFromCookie();
  let orgType: 'franchisor' | 'franchisee' | 'independent' = 'independent';
  if (orgId) {
    const supabase = await createClient();
    const { data: org } = await supabase
      .from('organizations')
      .select('org_type')
      .eq('id', orgId)
      .single();
    if (org?.org_type) orgType = org.org_type as 'franchisor' | 'franchisee' | 'independent';
  }

  return (
    <div className="space-y-2">
      <ImportReviewClient batchId={batchId} orgType={orgType} />
    </div>
  );
}
