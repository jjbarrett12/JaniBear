'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface UpgradeActionsProps {
  /** Module key (e.g. helphubqr) for return URL */
  moduleKey: string;
  orgId: string;
  canUpgrade: boolean;
  fromPath?: string | null;
}

export function UpgradeActions({
  moduleKey,
  orgId,
  canUpgrade,
  fromPath,
}: UpgradeActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddToPlan = async () => {
    if (!canUpgrade) return;
    setLoading(true);
    try {
      const returnPath =
        fromPath && fromPath.startsWith('/app/')
          ? fromPath
          : `/app/upgrade?module=${moduleKey}&success=1`;
      const returnUrl = `${window.location.origin}${returnPath}`;

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          return_url: returnUrl,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to open billing');
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No portal URL returned');
    } catch (e) {
      console.error('Portal error:', e);
      setLoading(false);
      alert(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    }
  };

  if (!canUpgrade) {
    return (
      <p className="text-sm text-muted-foreground mt-4">
        Only billing managers can add modules. Ask an owner or admin to upgrade
        for your organization.
      </p>
    );
  }

  return (
    <Button
      onClick={handleAddToPlan}
      disabled={loading}
      className="mt-4"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Opening…
        </>
      ) : (
        'Add to plan'
      )}
    </Button>
  );
}
