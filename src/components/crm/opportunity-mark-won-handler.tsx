'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { markDealWon } from '@/actions/crm';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * When URL has ?mark=won, run markDealWon and show success. For Cub, show optional upsell banner after success.
 */
export function OpportunityMarkWonHandler({
  opportunityId,
  planType,
}: {
  opportunityId: string;
  planType: 'cub' | 'grizzly' | 'kodiak';
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [done, setDone] = useState(false);
  const [showCubBanner, setShowCubBanner] = useState(false);

  const markWon = searchParams?.get('mark') === 'won';

  useEffect(() => {
    if (!markWon || !opportunityId || done) return;

    let cancelled = false;
    (async () => {
      const { error } = await markDealWon(opportunityId);
      if (cancelled) return;
      setDone(true);
      if (error) {
        toast({ title: 'Could not mark as won', description: error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Deal marked as won' });
      if (planType === 'cub') setShowCubBanner(true);
      const p = new URLSearchParams(searchParams?.toString() ?? '');
      p.delete('mark');
      const q = p.toString();
      router.replace(window.location.pathname + (q ? `?${q}` : ''), { scroll: false });
    })();
    return () => { cancelled = true; };
  }, [markWon, opportunityId, done, planType, searchParams, router, toast]);

  if (showCubBanner) {
    return (
      <Card className="border-primary/30 bg-primary/5 mb-4">
        <CardContent className="pt-4 pb-4">
          <p className="font-medium text-foreground mb-1">Deal marked as Won</p>
          <p className="text-sm text-muted-foreground mb-3">
            Want to automate onboarding and service execution? Upgrade to Grizzly to hand off won deals to Operations.
          </p>
          <Button asChild size="sm">
            <Link href="/pricing">Upgrade to Grizzly</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
