import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InspectionRunner } from '@/components/inspections/inspection-runner';

export default async function RunInspectionPage({
  searchParams,
}: {
  searchParams: { location?: string; template?: string; schedule?: string; date?: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  if (!searchParams.location || !searchParams.template) {
    redirect('/app/inspections/start');
  }

  // Load location and template
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', searchParams.location)
    .eq('org_id', org.org_id)
    .single();

  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', searchParams.template)
    .eq('org_id', org.org_id)
    .single();

  if (!location || !template) {
    redirect('/app/inspections/start');
  }

  // Load template sections and items
  const { data: sections } = await supabase
    .from('template_sections')
    .select('*, template_items(*)')
    .eq('template_id', template.id)
    .order('sort_order');

  return (
    <InspectionRunner
      location={location}
      template={template}
      sections={sections || []}
      scheduleId={searchParams.schedule || undefined}
      scheduledDate={searchParams.date || undefined}
    />
  );
}
