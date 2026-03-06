'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PerformanceRow {
  operator_type: string;
  operator_id: string;
  qc_score: number;
  complaint_rate: number;
  missed_tasks_rate: number;
  capacity_score: number;
  total_score: number;
  score_updated_at: string;
}

interface Props {
  performances: PerformanceRow[];
  operatorNames: Map<string, string>;
  territories: { id: string; name: string }[];
  crews: { id: string; name: string }[];
}

export function PerformanceLeaderboard({ performances, operatorNames, territories, crews }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'crew' | 'franchisee'>('all');

  const filtered = useMemo(() => {
    let list = performances;
    if (typeFilter !== 'all') list = list.filter((p) => p.operator_type === typeFilter);
    return list;
  }, [performances, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <div className="flex gap-1">
          {(['all', 'crew', 'franchisee'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {t === 'all' ? 'All' : t === 'crew' ? 'Crew' : 'Franchisee'}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Operator</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">QC Score</TableHead>
              <TableHead className="text-right">Complaint Rate</TableHead>
              <TableHead className="text-right">Missed Tasks Rate</TableHead>
              <TableHead className="text-right">Capacity</TableHead>
              <TableHead className="text-right">Total Score</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const name = operatorNames.get(`${p.operator_type}:${p.operator_id}`) ?? p.operator_id;
              const restricted = p.total_score < 50;
              return (
                <TableRow key={`${p.operator_type}:${p.operator_id}`} className={restricted ? 'bg-muted/50' : ''}>
                  <TableCell className="font-medium">{name}</TableCell>
                  <TableCell className="capitalize">{p.operator_type}</TableCell>
                  <TableCell className="text-right">{Number(p.qc_score).toFixed(1)}</TableCell>
                  <TableCell className="text-right">{Number(p.complaint_rate).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{Number(p.missed_tasks_rate * 100).toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{Number(p.capacity_score).toFixed(0)}</TableCell>
                  <TableCell className="text-right">
                    <span className={restricted ? 'text-destructive font-medium' : ''}>
                      {Number(p.total_score).toFixed(0)}
                    </span>
                    {restricted && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Restricted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {p.score_updated_at ? new Date(p.score_updated_at).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No operator performance data. Run the nightly recalculation or trigger from Admin.</p>
      )}
    </div>
  );
}
