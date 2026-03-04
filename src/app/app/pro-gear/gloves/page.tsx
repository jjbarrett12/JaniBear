import Link from 'next/link';
import { StorefrontProductCard } from '@/components/pro-gear/storefront-product-card';
import { StorefrontFilters } from '@/components/pro-gear/storefront-filters';
import { getFilteredProGearProducts, getProGearBrands } from '@/lib/pro-gear-filters';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearGlovesPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; min_price?: string; max_price?: string }>;
}) {
  const params = await searchParams;
  const [products, brands] = await Promise.all([
    getFilteredProGearProducts({ ...params, category: 'gloves' }, { category: 'gloves' }),
    getProGearBrands('gloves'),
  ]);

  const list = products as ProGearProduct[];

  return (
    <>
      <header className="mb-6">
        <nav className="text-sm text-muted-foreground mb-2">
          <Link href="/app/pro-gear" className="hover:text-foreground">Pro Gear</Link>
          <span className="mx-1">/</span>
          <span className="text-foreground">Gloves</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Gloves</h1>
        <p className="mt-1 text-muted-foreground">
          Disposable gloves — member pricing
        </p>
      </header>
      <div className="mb-4">
        <StorefrontFilters brands={brands} currentCategory="gloves" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((p) => (
          <StorefrontProductCard key={p.id} p={p} />
        ))}
      </div>
      {list.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No gloves match your filters.</p>
      )}
    </>
  );
}
