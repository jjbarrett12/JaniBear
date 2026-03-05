'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function BillingClient({
  orgId,
  hasCustomer,
  isLocked,
  isCanceled,
}: {
  orgId: string;
  hasCustomer: boolean;
  isLocked: boolean;
  isCanceled: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handleUpdatePayment() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? 'Failed to open billing portal');
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  if (isCanceled) {
    return (
      <p className="text-muted-foreground">
        Subscription canceled. Go to onboarding to set up a new subscription.
      </p>
    );
  }

  if (!hasCustomer) {
    return (
      <p className="text-muted-foreground">
        No payment method on file. Complete onboarding to add a subscription.
      </p>
    );
  }

  return (
    <Button onClick={handleUpdatePayment} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      Update payment method
    </Button>
  );
}
