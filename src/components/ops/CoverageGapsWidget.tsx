'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { CoverageGapRow } from '@/lib/shifts/coverage-gaps-data';
import type { ShiftBackupRecommendation } from '@/lib/shifts/recommendBackup';
import { AlertCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  gaps: CoverageGapRow[];
  dateLabel: string;
}

export function CoverageGapsWidget({ gaps, dateLabel }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [recs, setRecs] = useState<Record<string, ShiftBackupRecommendation[]>>({});
  const [assigning, setAssigning] = useState<string | null>(null);

  const loadRecommendations = useCallback(async (shiftId: string) => {
    if (recs[shiftId]) return;
    setLoadingId(shiftId);
    try {
      const res = await fetch(`/api/app/shifts/${shiftId}/recommendations`);
      const json = await res.json();
      if (res.ok && json.data) setRecs((prev) => ({ ...prev, [shiftId]: json.data }));
    } finally {
      setLoadingId(null);
    }
  }, [recs]);

  const assignBackup = useCallback(async (shiftId: string, operator_type: string, operator_id: string) => {
    setAssigning(shiftId);
    try {
      const res = await fetch(`/api/app/shifts/${shiftId}/assign-backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_type, operator_id }),
      });
      if (res.ok) {
        setRecs((prev) => ({ ...prev, [shiftId]: [] }));
        toast({ title: 'Backup assigned', description: 'Coverage has been updated.' });
        router.refresh();
      }
    } finally {
      setAssigning(null);
    }
  }, []);

  if (gaps.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold text-foreground">Coverage Gaps {dateLabel}</h2>
        </div>
        <div className="px-4 py-6 text-sm text-muted-foreground">
          No coverage gaps right now.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <h2 className="font-semibold text-foreground">Coverage Gaps {dateLabel}</h2>
      </div>
      <div className="divide-y divide-border">
        {gaps.map((gap) => (
          <div key={gap.id} className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{gap.account_name || gap.facility_name || gap.account_id}</p>
                <p className="text-sm text-muted-foreground">
                  {gap.start_time} – {gap.end_time}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadRecommendations(gap.id)}
                disabled={!!loadingId}
              >
                {loadingId === gap.id ? 'Loading…' : 'Recommended backup'}
              </Button>
            </div>
            {recs[gap.id] && recs[gap.id].length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {recs[gap.id].map((r) => (
                  <div key={`${r.operator_type}:${r.operator_id}`} className="flex items-center gap-2 rounded border border-border bg-muted/30 px-2 py-1 text-sm">
                    <span>{r.operator_name}</span>
                    <span className="text-muted-foreground">({r.score.toFixed(0)})</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => assignBackup(gap.id, r.operator_type, r.operator_id)}
                      disabled={!!assigning}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {recs[gap.id] && recs[gap.id].length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">No backup recommendations available (check backup pool and capacity).</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
