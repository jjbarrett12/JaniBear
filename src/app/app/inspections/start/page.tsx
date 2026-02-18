import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InspectionStarter } from '@/components/inspections/inspection-starter';

export default async function StartInspectionPage({
  searchParams,
}: {
  searchParams: { location?: string; template?: string; schedule?: string; date?: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  // If all params provided, redirect to inspection runner
  if (searchParams.location && searchParams.template) {
    redirect(`/app/inspections/run?location=${searchParams.location}&template=${searchParams.template}&schedule=${searchParams.schedule || ''}&date=${searchParams.date || ''}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Start Inspection</h1>
        <p className="text-muted-foreground mt-1">Select location and template</p>
      </div>
      <InspectionStarter />
    </div>
  );
}
