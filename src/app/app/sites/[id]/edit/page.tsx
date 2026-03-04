import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LocationForm } from '@/components/locations/location-form';

export default async function SiteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!location) notFound();

  const initialData = {
    id: location.id,
    name: location.name,
    address: location.address ?? undefined,
    city: location.city ?? undefined,
    state: location.state ?? undefined,
    zip: location.zip ?? undefined,
    square_footage: location.square_footage ?? undefined,
    notes: location.notes ?? undefined,
    status: location.status ?? 'active',
    sqft_by_flooring_type: location.sqft_by_flooring_type ?? undefined,
    restroom_count: location.restroom_count ?? undefined,
    days_of_service: location.days_of_service ?? undefined,
    door_alarm_code: location.door_alarm_code ?? undefined,
    contact_name: location.contact_name ?? undefined,
    contact_phone: location.contact_phone ?? undefined,
    contact_email: location.contact_email ?? undefined,
    billing_contact_name: location.billing_contact_name ?? undefined,
    billing_contact_phone: location.billing_contact_phone ?? undefined,
    billing_contact_email: location.billing_contact_email ?? undefined,
    billing_address: location.billing_address ?? undefined,
    billing_notes: location.billing_notes ?? undefined,
    account_billing_notes: location.account_billing_notes ?? undefined,
    authorized_to_order_supplies: location.authorized_to_order_supplies ?? undefined,
    contract_storage_path: location.contract_storage_path ?? undefined,
    types_of_supplies_used: location.types_of_supplies_used ?? undefined,
    special_instructions: location.special_instructions ?? undefined,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/app/sites/${id}`} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit site</h1>
          <p className="text-muted-foreground">Update location (site) details</p>
        </div>
      </div>
      <LocationForm initialData={initialData} />
    </div>
  );
}
