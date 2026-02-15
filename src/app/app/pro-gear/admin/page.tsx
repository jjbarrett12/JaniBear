import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/components/pro-gear/product-card';
import { ProGearProductToggle } from '@/components/pro-gear/admin-product-toggle';
import type { ProGearProduct } from '@/types/pro-gear';

export default async function ProGearAdminPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('pro_gear_products')
    .select('*')
    .order('category')
    .order('name');

  const list = (products ?? []) as ProGearProduct[];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pro Gear — Product list</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-right">Member price</th>
              <th className="p-2 text-center">Active</th>
              <th className="p-2 text-center">Featured</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="p-2">
                  <Link
                    href={`/app/pro-gear/product/${p.slug}`}
                    className="font-medium hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="p-2">{p.category}</td>
                <td className="p-2 text-right">{formatPrice(p.member_price_cents)}</td>
                <td className="p-2 text-center">
                  <ProGearProductToggle productId={p.id} field="active" value={p.active} />
                </td>
                <td className="p-2 text-center">
                  <ProGearProductToggle productId={p.id} field="featured" value={p.featured} />
                </td>
                <td className="p-2 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/app/pro-gear/admin/products/${p.id}/edit`}>Edit</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && (
        <p className="text-muted-foreground">No products. Use Import to add.</p>
      )}
    </div>
  );
}
