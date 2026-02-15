'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  updateCartItemQuantityAction,
  removeCartItemAction,
} from '@/app/app/pro-gear/actions';
import { CreditCard, FileText } from 'lucide-react';

export function CartActions({
  orderItemId,
  quantity: initialQuantity,
  productSlug,
}: {
  orderItemId: string;
  quantity: number;
  productSlug?: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [pending, setPending] = useState(false);

  async function handleUpdate() {
    if (quantity < 1) return;
    setPending(true);
    try {
      await updateCartItemQuantityAction(orderItemId, quantity);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleRemove() {
    setPending(true);
    try {
      await removeCartItemAction(orderItemId);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          onBlur={handleUpdate}
          className="w-16"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={handleUpdate}
        >
          Update
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        disabled={pending}
        onClick={handleRemove}
      >
        Remove
      </Button>
    </div>
  );
}

const FINANCING_APR = 0.12;

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function SubmitOrderButton({
  orderId,
  totalCents,
}: {
  orderId: string;
  totalCents: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const totalWithInterest6 = Math.round(totalCents * (1 + FINANCING_APR));
  const monthly6 = Math.round(totalWithInterest6 / 6);
  const totalWithInterest12 = Math.round(totalCents * (1 + FINANCING_APR));
  const monthly12 = Math.round(totalWithInterest12 / 12);

  async function handleCheckout(option: 'pay_in_full' | 'finance_6' | 'finance_12') {
    setPending(true);
    try {
      const res = await fetch('/api/pro-gear/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, option }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      console.error(data.error || 'Checkout failed');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full gap-2"
        onClick={() => handleCheckout('pay_in_full')}
        disabled={pending}
      >
        <CreditCard className="h-4 w-4" />
        Pay in full — {formatPrice(totalCents)}
      </Button>
      <div className="space-y-1.5">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => handleCheckout('finance_6')}
          disabled={pending}
        >
          <FileText className="h-4 w-4" />
          6 months at 12% APR — {formatPrice(monthly6)}/mo
        </Button>
        <p className="text-xs text-muted-foreground px-1">
          {formatPrice(totalWithInterest6)} total with interest; first payment today.
        </p>
      </div>
      <div className="space-y-1.5">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => handleCheckout('finance_12')}
          disabled={pending}
        >
          <FileText className="h-4 w-4" />
          12 months at 12% APR — {formatPrice(monthly12)}/mo
        </Button>
        <p className="text-xs text-muted-foreground px-1">
          {formatPrice(totalWithInterest12)} total with interest; first payment today.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        Your card will be charged the first payment now and automatically each month for the chosen term.
      </p>
    </div>
  );
}
