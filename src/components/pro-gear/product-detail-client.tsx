'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { addToCartAction } from '@/app/app/pro-gear/actions';
import type { ProGearProduct } from '@/types/pro-gear';

export function ProGearProductDetailClient({
  product,
  showPrivateLabel,
}: {
  product: ProGearProduct;
  showPrivateLabel?: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  async function handleAddToCart() {
    setPending(true);
    try {
      const ok = await addToCartAction(product.id, quantity);
      if (ok) router.push('/app/pro-gear/cart');
      else throw new Error('Failed to add');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="qty">Qty</Label>
          <Input
            id="qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-20"
          />
        </div>
        <Button onClick={handleAddToCart} disabled={pending} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
      </div>
      {showPrivateLabel && (
        <Button
          variant="outline"
          asChild
          className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
        >
          <Link href={`/app/pro-gear/private-label/${product.id}`}>
            <MessageCircle className="h-4 w-4" />
            Discuss Private Label
          </Link>
        </Button>
      )}
    </div>
  );
}
