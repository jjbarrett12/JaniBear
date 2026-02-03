import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/supplies/product-form';

export default async function NewProductPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('org_id', org.org_id)
    .eq('is_active', true)
    .order('name');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/supplies/products" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
          <p className="text-gray-600">Create a new product in your catalog</p>
        </div>
      </div>

      <ProductForm orgId={org.org_id} vendors={vendors || []} />
    </div>
  );
}
