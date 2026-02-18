import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VendorForm } from '@/components/supplies/vendor-form';

export default async function NewVendorPage() {
  const org = await requireOrg();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/supplies/vendors" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Vendor</h1>
          <p className="text-gray-600">Create a new vendor for supply orders</p>
        </div>
      </div>

      <VendorForm orgId={org.org_id} />
    </div>
  );
}
