'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toggleProGearProductFieldAction } from '@/app/app/pro-gear/admin-actions';

export function ProGearProductToggle({
  productId,
  field,
  value,
}: {
  productId: string;
  field: 'active' | 'featured';
  value: boolean;
}) {
  const router = useRouter();

  async function handleToggle() {
    await toggleProGearProductFieldAction(productId, field, !value);
    router.refresh();
  }

  return (
    <Button
      variant={value ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
    >
      {value ? 'Yes' : 'No'}
    </Button>
  );
}
