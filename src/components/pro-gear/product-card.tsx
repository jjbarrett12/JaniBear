import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart } from 'lucide-react';
import type { ProGearProduct } from '@/types/pro-gear';

export function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function ProductCard({ p }: { p: ProGearProduct }) {
  const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
  const hasLaborSavings =
    p.category === 'equipment' &&
    p.estimated_labor_hours_saved_per_week != null &&
    p.estimated_labor_hours_saved_per_week > 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-square items-center justify-center bg-muted">
        {img ? (
          <img
            src={img}
            alt={p.name}
            className="h-full w-full object-contain"
          />
        ) : (
          <Package className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/app/pro-gear/product/${p.slug}`}
            className="font-semibold leading-tight hover:underline"
          >
            {p.name}
          </Link>
          {p.savings_percent != null && (
            <Badge className="shrink-0 bg-green-600 hover:bg-green-700">
              Save {p.savings_percent}%
            </Badge>
          )}
        </div>
        {p.brand && (
          <p className="text-xs text-muted-foreground">{p.brand}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">
            {formatPrice(p.member_price_cents)}
          </span>
          {p.retail_price_cents != null && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(p.retail_price_cents)}
            </span>
          )}
        </div>
        {hasLaborSavings && (
          <Badge variant="secondary" className="text-xs">
            Labor savings
          </Badge>
        )}
        <Button asChild size="sm" className="w-full">
          <Link href={`/app/pro-gear/product/${p.slug}`}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
