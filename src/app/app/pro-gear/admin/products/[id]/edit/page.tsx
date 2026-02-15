import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProGearProductEditForm } from '@/components/pro-gear/admin-product-edit-form';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearAdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from('pro_gear_products')
    .select('*')
    .eq('id', id)
    .single();

  if (!product) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <nav className="text-sm text-muted-foreground">
        <Link href="/app/pro-gear/admin" className="hover:text-foreground">
          Admin
        </Link>
        {' / Edit product'}
      </nav>
      <ProGearProductEditForm product={product as ProGearProduct} />
    </div>
  );
}
