import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicReportView } from '@/components/reports/public-report-view';

export default async function PublicReportPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();

  // Find report share by token
  const { data: share } = await supabase
    .from('report_shares')
    .select('*, inspections(*, locations(*), templates(*), profiles(full_name))')
    .eq('token', params.token)
    .single();

  if (!share) {
    notFound();
  }

  // Check if expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-gray-600">This report link has expired.</p>
        </div>
      </div>
    );
  }

  const inspection = share.inspections;

  // Load sections with responses
  const { data: sections } = await supabase
    .from('template_sections')
    .select('*, template_items(*, inspection_responses(*), inspection_photos(*))')
    .eq('template_id', inspection.template_id)
    .order('sort_order');

  // Load section scores
  const { data: sectionScores } = await supabase
    .from('inspection_section_scores')
    .select('*')
    .eq('inspection_id', inspection.id);

  return (
    <PublicReportView
      inspection={inspection}
      sections={sections || []}
      sectionScores={sectionScores || []}
    />
  );
}
