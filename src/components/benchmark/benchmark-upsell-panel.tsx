'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Check } from 'lucide-react';
import Link from 'next/link';
import {
  BENCHMARK_UPSELL_TITLE,
  BENCHMARK_UPSELL_DESCRIPTION,
  BENCHMARK_UPSELL_BULLET_1,
  BENCHMARK_UPSELL_BULLET_2,
  BENCHMARK_UPSELL_BULLET_3,
  BENCHMARK_UPSELL_CTA,
  BENCHMARK_UPSELL_CTA_SUBTEXT,
} from '@/lib/benchmark-copy';

export interface BenchmarkUpsellPanelProps {
  canManageSettings?: boolean;
}

export function BenchmarkUpsellPanel({ canManageSettings }: BenchmarkUpsellPanelProps) {
  return (
    <Card className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{BENCHMARK_UPSELL_TITLE}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{BENCHMARK_UPSELL_DESCRIPTION}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <span>{BENCHMARK_UPSELL_BULLET_1}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <span>{BENCHMARK_UPSELL_BULLET_2}</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
            <span>{BENCHMARK_UPSELL_BULLET_3}</span>
          </li>
        </ul>
        <div className="pt-2">
          {canManageSettings ? (
            <Button asChild size="sm" className="gap-2">
              <Link href="/app/settings">
                {BENCHMARK_UPSELL_CTA}
              </Link>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">{BENCHMARK_UPSELL_CTA_SUBTEXT}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
