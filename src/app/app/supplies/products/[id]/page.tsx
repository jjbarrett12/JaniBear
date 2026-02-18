import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductForm } from '@/components/supplies/product-form';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const [productResult, vendorsResult] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('org_id', org.org_id)
      .single(),
    supabase
      .from('vendors')
      .select('id, name')
      .eq('org_id', org.org_id)
      .eq('is_active', true)
      .order('name'),
  ]);

  if (!productResult.data) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/supplies/products" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
          <p className="text-gray-600">{productResult.data.name}</p>
        </div>
      </div>

      <ProductForm 
        orgId={org.org_id} 
        vendors={vendorsResult.data || []} 
        product={productResult.data} 
      />
    </div>
  );
}
