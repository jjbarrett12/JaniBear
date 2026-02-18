import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/pro-gear/product-card';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearEquipmentPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('pro_gear_products')
    .select('*')
    .eq('active', true)
    .eq('category', 'equipment')
    .order('name');

  const list = (products ?? []) as ProGearProduct[];

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Equipment</h1>
        <p className="mt-1 text-muted-foreground">
          Vacuums, scrubbers, burnishers — member pricing
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="text-muted-foreground">No equipment available.</p>
      )}
    </>
  );
}
