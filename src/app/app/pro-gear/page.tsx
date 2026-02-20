import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Package, Store, ChevronRight } from 'lucide-react';
import { StorefrontProductCard } from '@/components/pro-gear/storefront-product-card';
import { StorefrontFilters } from '@/components/pro-gear/storefront-filters';
import { LargeOpportunityForm } from '@/components/pro-gear/large-opportunity-form';
import { getFilteredProGearProducts, getProGearBrands } from '@/lib/pro-gear-filters';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearHomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; min_price?: string; max_price?: string }>;
}) {
  const params = await searchParams;
  const [products, brands] = await Promise.all([
    getFilteredProGearProducts(params),
    getProGearBrands(params.category),
  ]);

  const featured = (products as ProGearProduct[]).filter((p) => p.featured);
  const list = products as ProGearProduct[];

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
          Member Pro Gear
        </h1>
        <p className="mt-1 text-muted-foreground">
          Equipment &amp; Gloves — Member pricing. Discounted gear for members.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/app/pro-gear/gloves" className="block">
            <Card className="overflow-hidden transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Gloves</h3>
                  <p className="text-sm text-muted-foreground">
                    Disposable gloves — nitrile, vinyl, latex
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>
          <Link href="/app/pro-gear/equipment" className="block">
            <Card className="overflow-hidden transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Equipment</h3>
                  <p className="text-sm text-muted-foreground">
                    Vacuums, scrubbers, burnishers, extractors
                  </p>
                </div>
                <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold uppercase tracking-wider text-muted-foreground">
            Featured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
              <StorefrontProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">All products</h2>
          <StorefrontFilters brands={brands} currentCategory={params.category} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <StorefrontProductCard key={p.id} p={p} />
          ))}
        </div>
        {list.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No products match your filters.</p>
        )}
      </section>

      <section className="mt-12 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Large order or bulk opportunity?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us your estimated quantity or order value and we&apos;ll contact you.
        </p>
        <div className="mt-4">
          <LargeOpportunityForm />
        </div>
      </section>
    </>
  );
}
