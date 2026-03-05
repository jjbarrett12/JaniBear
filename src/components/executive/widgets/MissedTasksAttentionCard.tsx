'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardX, ChevronRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  useSheet,
} from '@/components/ui/sheet';
import type { MissedTasksKpi } from '../types';

const severityStyle =
  'border-orange-500/30 bg-orange-500/20 text-orange-300';

interface MissedTasksAttentionCardProps {
  kpi: MissedTasksKpi;
}

function AssignMakeUpSheetStub() {
  const { onOpenChange } = useSheet();
  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-foreground">Assign make-up</SheetTitle>
        <SheetDescription className="text-muted-foreground">
          {/* TODO: Wire to create make-up task flow — server action or API. */}
          Select missed tasks and assign make-up work to crew or dates.
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 px-6 py-4 text-sm text-muted-foreground">
        <p>Placeholder for assign make-up flow. TODO: connect to task creation API.</p>
        <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </>
  );
}

export function MissedTasksAttentionCard({ kpi }: MissedTasksAttentionCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const style = severityStyle;

  return (
    <>
      <div
        className={`flex flex-col gap-3 p-4 rounded-xl bg-[#0F172A]/60 border ${style} hover:bg-[#0F172A]/80 hover:border-white/20 transition-colors`}
      >
        <div className="flex items-start gap-3 min-w-0">
          <ClipboardX className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white">Missed Tasks</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md border bg-amber-500/20 text-amber-300 border-amber-500/40">
                {kpi.missedTasksUnreviewedToday} unreviewed
              </span>
            </div>
            <p className="text-sm text-white/60 mt-0.5">
              {kpi.missedTasksCritical} critical • {kpi.buildingsImpactedToday} buildings impacted
            </p>
            {kpi.disputedToday > 0 ? (
              <p className="text-xs text-white/50 mt-0.5">{kpi.disputedToday} disputed</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            asChild
            size="sm"
            className="bg-amber-500/90 hover:bg-amber-500 text-white border-0"
          >
            <Link href="/app/ops/missed-tasks?status=unreviewed">
              Review misses
              <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setSheetOpen(true)}
          >
            Assign make-up
            <UserPlus className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="bg-[#0B1220] border-white/10 text-white flex flex-col"
        >
          <AssignMakeUpSheetStub />
        </SheetContent>
      </Sheet>
    </>
  );
}
