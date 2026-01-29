import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { LocationForm } from '@/components/locations/location-form';

export default async function EditLocationPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!location) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Location</h1>
        <p className="text-gray-600 mt-1">Update location details</p>
      </div>
      <LocationForm initialData={location} />
    </div>
  );
}
