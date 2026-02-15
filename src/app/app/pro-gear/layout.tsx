import { requireOrg } from '@/lib/auth';
import { requireProGearAccess } from '@/lib/pro-gear-auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, Package, Wrench } from 'lucide-react';

export default async function ProGearLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOrg();
  await requireProGearAccess();

  const supabase = await createClient();
  const { data: products } = await supabase
    .from('pro_gear_products')
    .select('id, slug, name, category')
    .eq('active', true);

  const gloves = products?.filter((p) => p.category === 'gloves') ?? [];
  const equipment = products?.filter((p) => p.category === 'equipment') ?? [];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/app/pro-gear" className="hover:text-foreground">
          Pro Gear
        </Link>
        <ChevronRight className="h-4 w-4" />
      </nav>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-56 shrink-0 space-y-4">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/app/pro-gear"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Package className="h-4 w-4" />
                  All
                </Link>
              </li>
              <li>
                <Link
                  href="/app/pro-gear/gloves"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Package className="h-4 w-4" />
                  Gloves ({gloves.length})
                </Link>
              </li>
              <li>
                <Link
                  href="/app/pro-gear/equipment"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  <Wrench className="h-4 w-4" />
                  Equipment ({equipment.length})
                </Link>
              </li>
            </ul>
          </div>
          <Link
            href="/app/pro-gear/cart"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
          </Link>
          <Link
            href="/app/pro-gear/orders"
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
          >
            Order history
          </Link>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
