'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Minus, Plus } from 'lucide-react';
import { formatPrice } from '@/components/pro-gear/product-card';
import { addToCartAction } from '@/app/app/pro-gear/actions';
import type { ProGearProduct } from '@/types/pro-gear';

export function StorefrontProductCard({ p }: { p: ProGearProduct }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
  const productCode = p.sku || p.slug;
  const hasLaborSavings =
    p.category === 'equipment' &&
    p.estimated_labor_hours_saved_per_week != null &&
    p.estimated_labor_hours_saved_per_week > 0;

  async function handleAddToCart() {
    setAdding(true);
    try {
      const ok = await addToCartAction(p.id, quantity);
      if (ok) router.push('/app/pro-gear/cart');
      else router.refresh();
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="flex aspect-square items-center justify-center bg-muted/50 border-b">
        {img ? (
          <img
            src={img}
            alt={p.name}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <Package className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      <CardHeader className="pb-2 pt-3">
        <Link
          href={`/app/pro-gear/product/${p.slug}`}
          className="font-semibold leading-tight hover:underline line-clamp-2"
        >
          {p.name}
        </Link>
        {productCode && (
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {productCode}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {p.savings_percent != null && (
            <Badge className="bg-green-600 hover:bg-green-700 text-xs">
              Save {p.savings_percent}%
            </Badge>
          )}
          {hasLaborSavings && (
            <Badge variant="secondary" className="text-xs">
              Labor savings
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 mt-auto space-y-3">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(p.member_price_cents)}
          </span>
          {p.retail_price_cents != null && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(p.retail_price_cents)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-11 text-center text-sm border-0 bg-transparent h-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            size="sm"
            className="gap-1.5 flex-1 min-w-0"
            onClick={handleAddToCart}
            disabled={adding}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
