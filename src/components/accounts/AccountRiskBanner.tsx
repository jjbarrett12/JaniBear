'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  accountId: string;
  accountName: string;
  riskLevel: string;
  riskScore: number;
  topReason: string | null;
}

export function AccountRiskBanner({ accountId, accountName, riskLevel, riskScore, topReason }: Props) {
  return (
    <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <p className="font-medium text-foreground">
            Account at Risk — {accountName}
          </p>
          <p className="text-sm text-muted-foreground">
            {topReason ?? `Risk level: ${riskLevel} (score ${riskScore})`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/app/ops/risk/${accountId}`}>
          <Button variant="outline" size="sm">View risk</Button>
        </Link>
        <Link href={`/app/ops/risk/${accountId}`}>
          <Button size="sm">Assign backup</Button>
        </Link>
        <Link href={`/app/ops/risk/${accountId}`}>
          <Button variant="secondary" size="sm">Create intervention</Button>
        </Link>
      </div>
    </div>
  );
}
