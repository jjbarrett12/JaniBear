import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VendorForm } from '@/components/supplies/vendor-form';

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!vendor) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/supplies/vendors" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Vendor</h1>
          <p className="text-gray-600">{vendor.name}</p>
        </div>
      </div>

      <VendorForm orgId={org.org_id} vendor={vendor} />
    </div>
  );
}
