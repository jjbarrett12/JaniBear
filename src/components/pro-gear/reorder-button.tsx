'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { reorderOrderAction } from '@/app/app/pro-gear/actions';

export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleReorder() {
    setPending(true);
    try {
      const ok = await reorderOrderAction(orderId);
      if (ok) router.push('/app/pro-gear/cart');
      else router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReorder} disabled={pending}>
      {pending ? 'Adding…' : 'Reorder'}
    </Button>
  );
}
