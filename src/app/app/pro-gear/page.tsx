import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Package, Wrench, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/pro-gear/product-card';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearHomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('pro_gear_products')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false });

  const featured = products?.filter((p) => p.featured) ?? [];
  const gloves = products?.filter((p) => p.category === 'gloves') ?? [];
  const equipment = products?.filter((p) => p.category === 'equipment') ?? [];

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Member Pro Gear
        </h1>
        <p className="mt-1 text-muted-foreground">
          Equipment &amp; Gloves — Member Pricing
        </p>
      </header>

      <section className="mb-10">
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
                  <Wrench className="h-10 w-10 text-primary" />
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
          <h2 className="mb-4 text-lg font-semibold">Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p as ProGearProduct} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold">All products</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(products ?? []).map((p) => (
            <ProductCard key={p.id} p={p as ProGearProduct} />
          ))}
        </div>
      </section>
    </>
  );
}

