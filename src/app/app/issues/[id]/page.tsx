import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { IssueDetail } from '@/components/issues/issue-detail';

export default async function IssueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from('issues')
    .select('*, locations(name), profiles(full_name)')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!issue) {
    notFound();
  }

  // Load comments
  const { data: comments } = await supabase
    .from('issue_comments')
    .select('*, profiles(full_name)')
    .eq('issue_id', issue.id)
    .order('created_at', { ascending: true });

  // Load photos
  const { data: photos } = await supabase
    .from('issue_photos')
    .select('*')
    .eq('issue_id', issue.id);

  return (
    <IssueDetail
      issue={issue}
      comments={comments || []}
      photos={photos || []}
    />
  );
}
