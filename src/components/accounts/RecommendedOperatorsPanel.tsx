'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { assignRecommendedOperator } from '@/actions/account-assignment';
import type { SuggestedOperator } from '@/lib/accounts/suggestOperator';

interface Props {
  orgId: string;
  accountId: string;
  /** Initial suggestions from server (when we have lat/lng). */
  initialSuggestions: SuggestedOperator[] | null;
  /** Callback after assign (e.g. refresh). */
  onAssigned?: () => void;
}

export function RecommendedOperatorsPanel({
  orgId,
  accountId,
  initialSuggestions,
  onAssigned,
}: Props) {
  const [suggestions, setSuggestions] = useState<SuggestedOperator[] | null>(initialSuggestions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign(op: SuggestedOperator, bySystem: boolean) {
    setLoading(true);
    setError(null);
    const res = await assignRecommendedOperator(orgId, accountId, op.operator_type, op.operator_id, bySystem);
    setLoading(false);
    if (res.error) setError(res.error);
    else onAssigned?.();
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Recommended Operators</p>
        <p className="mt-1">Add a facility with address (and location if available) to see data-driven operator recommendations.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-medium text-foreground mb-3">Recommended Operators</p>
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}
      <div className="space-y-2">
        {suggestions.map((op, i) => (
          <div
            key={`${op.operator_type}:${op.operator_id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/60 bg-muted/20 p-2 text-sm"
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium">{op.operator_name}</span>
              <span className="ml-2 text-muted-foreground capitalize">({op.operator_type})</span>
              <div className="text-xs text-muted-foreground mt-0.5">
                Score {op.final_score.toFixed(0)} · Capacity {op.capacity_score.toFixed(0)}%
                {op.distance_miles != null && ` · ${op.distance_miles.toFixed(1)} mi`}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleAssign(op, false)}
              disabled={loading}
            >
              Assign
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Override: choose any operator to assign manually.</p>
    </div>
  );
}
