'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SiteProfitabilityRow } from '@/lib/financial-health-mock';

interface SiteProfitabilityTableProps {
  rows: SiteProfitabilityRow[];
  title: string;
  onRowClick?: (row: SiteProfitabilityRow) => void;
}

export function SiteProfitabilityTable({ rows, title, onRowClick }: SiteProfitabilityTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs">Site / Client</TableHead>
            <TableHead className="text-xs text-right">Revenue</TableHead>
            <TableHead className="text-xs text-right">Direct costs</TableHead>
            <TableHead className="text-xs text-right">GM%</TableHead>
            <TableHead className="text-xs">Why</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.siteId}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              onClick={() => onRowClick?.(row)}
            >
              <TableCell className="py-2 text-sm">
                <div>
                  <span className="font-medium">{row.siteName}</span>
                  <span className="text-muted-foreground block text-xs">{row.clientName}</span>
                </div>
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums">
                ${(row.revenue / 1000).toFixed(1)}k
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums">
                ${(row.directCosts / 1000).toFixed(1)}k
              </TableCell>
              <TableCell className="py-2 text-right text-sm tabular-nums">
                {row.gmPct}%
              </TableCell>
              <TableCell className="py-2">
                {row.whyTag ? (
                  <Badge variant="outline" className="text-xs font-normal">
                    {row.whyTag}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
