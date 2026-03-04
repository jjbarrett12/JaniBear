import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Store, ChevronRight, TrendingDown, Truck, Percent, RotateCcw } from 'lucide-react';
import { StorefrontProductCard } from '@/components/pro-gear/storefront-product-card';
import { StorefrontFilters } from '@/components/pro-gear/storefront-filters';
import { LargeOpportunityForm } from '@/components/pro-gear/large-opportunity-form';
import { getFilteredProGearProducts, getProGearBrands } from '@/lib/pro-gear-filters';
import {
  getProGearStatsForOrg,
  getSavingsOpportunities,
  getCategoryAvgSavings,
} from '@/lib/pro-gear-stats';
import type { ProGearProduct } from '@/types/pro-gear';

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function ProGearHomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; min_price?: string; max_price?: string }>;
}) {
  const org = await requireOrg();
  const params = await searchParams;
  const [products, brands, stats, savingsOpportunities, categorySavings] = await Promise.all([
    getFilteredProGearProducts(params),
    getProGearBrands(params.category),
    getProGearStatsForOrg(org.org_id),
    getSavingsOpportunities(org.org_id, 3),
    getCategoryAvgSavings(),
  ]);

  const featured = (products as ProGearProduct[]).filter((p) => p.featured);
  const list = products as ProGearProduct[];

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
          Buy Smarter. Protect Your Margin.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Member-negotiated pricing on equipment and gloves. See your savings on every product.
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-border bg-card/50 p-4">
        <h2 className="sr-only">Stats</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Saved this month
              </p>
              <p className="text-lg font-semibold text-foreground">
                {formatPrice(stats.membersSavedThisMonthCents)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Orders shipped
              </p>
              <p className="text-lg font-semibold text-foreground">
                {stats.ordersShippedThisMonth}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Avg discount
              </p>
              <p className="text-lg font-semibold text-foreground">
                {stats.avgDiscountPercent}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <RotateCcw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Auto-reorder
              </p>
              <p className="text-lg font-semibold text-foreground">
                {stats.autoReorderPercent}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/app/pro-gear/gloves" className="block">
            <Card className="overflow-hidden transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Gloves</h3>
                    {categorySavings.gloves > 0 && (
                      <Badge variant="secondary" className="text-green-700 dark:text-green-300">
                        Avg {categorySavings.gloves}% off
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Disposable gloves — nitrile, vinyl, latex
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          </Link>
          <Link href="/app/pro-gear/equipment" className="block">
            <Card className="overflow-hidden transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-10 w-10 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Equipment</h3>
                    {categorySavings.equipment > 0 && (
                      <Badge variant="secondary" className="text-green-700 dark:text-green-300">
                        Avg {categorySavings.equipment}% off
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vacuums, scrubbers, burnishers, extractors
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {savingsOpportunities.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Savings opportunities</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top savings on products you buy</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Biggest member vs retail gap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {savingsOpportunities.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                    <Link href={`/app/pro-gear/product/${p.slug}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <Badge className="bg-green-600 text-white shrink-0">
                      Save {formatPrice(p.savings_cents)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Smart reorder</h2>
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground">
              Set up recurring orders so you never run out. We&apos;ll suggest restocks based on your usage.
            </p>
            <Link
              href="/app/pro-gear/reorders"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Manage recurring orders →
            </Link>
          </CardContent>
        </Card>
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
