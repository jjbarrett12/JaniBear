import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { InspectionView } from '@/components/inspections/inspection-view';

export default async function InspectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from('inspections')
    .select('*, locations(*), templates(*), profiles(full_name)')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!inspection) {
    notFound();
  }

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
    <InspectionView
      inspection={inspection}
      sections={sections || []}
      sectionScores={sectionScores || []}
    />
  );
}
