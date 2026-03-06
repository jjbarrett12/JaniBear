'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/hint';
import { Building2, MapPin, Users, Calendar, UserPlus, ClipboardCheck, LayoutDashboard, Calculator, ScanLine } from 'lucide-react';

interface Props {
  batchId: string;
  accountsCreated: number;
  facilitiesCreated: number;
  crewsCreated: number;
  accountsSkipped: number;
  facilitiesSkipped: number;
}

/** Schedules are typically one per facility; use facilities as proxy if API doesn't return schedule count */
function schedulesCreated(facilitiesCreated: number): number {
  return facilitiesCreated;
}

const SUMMARY_ITEMS = [
  { key: 'customers' as const, label: 'Customers imported', icon: Building2 },
  { key: 'buildings' as const, label: 'Buildings configured', icon: MapPin },
  { key: 'operators' as const, label: 'Operators assigned', icon: Users },
  { key: 'schedules' as const, label: 'Schedules created', icon: Calendar },
];

export function ImportDoneClient({
  accountsCreated,
  facilitiesCreated,
  crewsCreated,
}: Props) {
  const schedules = schedulesCreated(facilitiesCreated);
  const values = {
    customers: accountsCreated,
    buildings: facilitiesCreated,
    operators: crewsCreated,
    schedules,
  };

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_ITEMS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">{values[key]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Success message */}
      <p className="text-center text-slate-600 text-base max-w-md mx-auto">
        JANIBEAR is ready to start running your operations.
      </p>
      <p className="text-center max-w-md mx-auto">
        <Hint>Imported schedules can be edited later from the dashboard.</Hint>
      </p>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white border-0">
            <Link href="/app/admin/invites">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Your Crew
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="outline" asChild className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50">
            <Link href="/app/ops/inspections">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Run First Inspection
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50">
            <Link href="/app/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50">
            <Link href="/app/sales/proposals">
              <Calculator className="mr-2 h-4 w-4" />
              Generate First Proposal
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50">
            <Link href="/app/sales/walkthroughs">
              <ScanLine className="mr-2 h-4 w-4" />
              Start LiDAR Scan
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
