'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import type { ActivationRecommendationResult } from '@/types/activation-recommendation';

interface AiRecommendedAssignmentCardProps {
  /** Launch packet ID (entity_id for new_account activation). */
  packetId: string;
  /** Optional initial data (e.g. from server). */
  initial?: ActivationRecommendationResult | null;
  /** Called when user clicks "Use recommended crew" — parent can pass crew to accept flow. */
  onUseRecommendation?: (crewId: string) => void;
  /** Optional: show "Accept with recommended crew" and call accept with crew id. */
  onAcceptWithCrew?: (crewId: string) => Promise<void>;
}

export function AiRecommendedAssignmentCard({
  packetId,
  initial,
  onUseRecommendation,
  onAcceptWithCrew,
}: AiRecommendedAssignmentCardProps) {
  const [data, setData] = useState<ActivationRecommendationResult | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial !== undefined) {
      setData(initial);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      `/api/app/ops/activation-recommendation?activation_type=new_account&entity_type=launch_packet&entity_id=${encodeURIComponent(packetId)}`
    )
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'Not allowed' : 'Failed to load recommendation');
        return res.json();
      })
      .then((json: ActivationRecommendationResult) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [packetId, initial]);

  if (loading) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            AI Recommended Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Computing best crew and backup options…</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            AI Recommended Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error ?? 'No recommendation available.'}</p>
        </CardContent>
      </Card>
    );
  }

  const hasPrimary = !!data.primary_crew_id;
  const riskVariant = data.risk_level === 'high' ? 'destructive' : data.risk_level === 'medium' ? 'secondary' : 'outline';

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
          AI Recommended Assignment
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on performance, capacity, proximity, and reliability. You can accept or override.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPrimary ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Users className="h-3 w-3" />
                Primary: {data.primary_crew_name ?? data.primary_crew_id}
              </Badge>
              {data.primary_supervisor_name && (
                <Badge variant="secondary" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  {data.primary_supervisor_name}
                </Badge>
              )}
            </div>
            {(data.recommended_headcount != null || data.weekly_labor_hours != null) && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {data.recommended_headcount != null && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {data.recommended_headcount} person{data.recommended_headcount !== 1 ? 's' : ''} recommended
                  </span>
                )}
                {data.weekly_labor_hours != null && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    ~{data.weekly_labor_hours} hrs/week
                  </span>
                )}
                {data.evening_day_split && (
                  <span>{data.evening_day_split}</span>
                )}
              </div>
            )}
            {data.secondary_crews.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Alternatives</p>
                <p className="text-sm">{data.secondary_crews.map((c) => c.name).join(', ')}</p>
              </div>
            )}
            {data.backup_crews.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Backup options</p>
                <p className="text-sm">{data.backup_crews.map((c) => c.name).join(', ')}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{data.reasoning_summary}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Confidence: {data.confidence_score}%</Badge>
              <Badge variant={riskVariant}>{data.risk_level} risk</Badge>
              {data.risk_flags.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  {data.risk_flags.join(', ')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {onAcceptWithCrew && data.primary_crew_id && (
                <Button
                  size="sm"
                  onClick={async () => {
                    setAccepting(true);
                    try {
                      await onAcceptWithCrew(data.primary_crew_id!);
                    } finally {
                      setAccepting(false);
                    }
                  }}
                  disabled={accepting}
                >
                  {accepting ? 'Accepting…' : 'Accept with recommended crew'}
                </Button>
              )}
              {onUseRecommendation && data.primary_crew_id && !onAcceptWithCrew && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onUseRecommendation(data.primary_crew_id!)}
                >
                  Use recommended crew
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{data.reasoning_summary}</p>
            <Badge variant="secondary">{data.risk_level} risk</Badge>
          </>
        )}
      </CardContent>
    </Card>
  );
}
