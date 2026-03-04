'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Lock, Rocket, ClipboardCheck, Users, Calendar, ArrowRight } from 'lucide-react';

/**
 * Full-page upgrade screen shown when Cub users hit /app/ops/* directly.
 * Explains benefits and offers CTA to pricing — no 404, no dead end.
 */
export function OperationsUpgradeScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 p-4">
          <Lock className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
            Operations is on Grizzly
          </h1>
          <p className="mt-2 text-muted-foreground">
            You’re on Cub — great for winning contracts. Upgrade to Grizzly to deliver them: launch queue, inspections, crews, and SLA tracking.
          </p>
        </div>
        <ul className="space-y-3 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-emerald-500 shrink-0" />
            Launch queue — onboard won deals and hand off to delivery
          </li>
          <li className="flex items-center gap-3">
            <ClipboardCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            Inspections & quality control
          </li>
          <li className="flex items-center gap-3">
            <Users className="h-5 w-5 text-emerald-500 shrink-0" />
            Crew management and scheduling
          </li>
          <li className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-emerald-500 shrink-0" />
            SLA tracking and issue resolution
          </li>
        </ul>
        <div className="pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/pricing">
              See Grizzly plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
