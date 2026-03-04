'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMockContractProfitability } from '@/lib/financial-health-mock';
import type { SiteProfitabilityRow } from '@/lib/financial-health-mock';
import { Info } from 'lucide-react';

interface ProfitabilityTabProps {
  onSiteRowClick?: (row: SiteProfitabilityRow) => void;
}

export function ProfitabilityTab({ onSiteRowClick }: ProfitabilityTabProps) {
  const [viewBy, setViewBy] = useState<'site' | 'client' | 'service'>('site');
  const [gmThreshold, setGmThreshold] = useState('45');
  const contractRows = getMockContractProfitability();
  const sorted = [...contractRows].sort((a, b) => a.marginPct - b.marginPct);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View by:</span>
          <div className="flex rounded-md border border-border p-0.5">
            {(['site', 'client', 'service'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setViewBy(v)}
                className={`px-3 py-1.5 text-sm rounded ${viewBy === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              >
                {v === 'site' ? 'By Site' : v === 'client' ? 'By Client' : 'By Service'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground shrink-0 flex items-center gap-1">
            Highlight GM% below
            <span title="Show sites/contracts with gross margin below this %">
              <Info className="h-3.5 w-3.5" />
            </span>
          </Label>
          <Select value={gmThreshold} onValueChange={setGmThreshold}>
            <SelectTrigger className="w-[80px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[20, 25, 30, 35, 40, 45, 50, 55].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Site</TableHead>
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-xs text-right">Revenue</TableHead>
                <TableHead className="text-xs text-right">Labor $</TableHead>
                <TableHead className="text-xs text-right">Supplies $</TableHead>
                <TableHead className="text-xs text-right">Other $</TableHead>
                <TableHead className="text-xs text-right">GM%</TableHead>
                <TableHead className="text-xs">Trend</TableHead>
                <TableHead className="text-xs w-16">Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow
                  key={row.client}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    onSiteRowClick?.({
                      siteId: row.client,
                      siteName: row.client,
                      clientName: row.client,
                      revenue: row.revenue,
                      directCosts: row.labor + row.supplies,
                      gmPct: row.marginPct,
                    })
                  }
                >
                  <TableCell className="py-2 text-sm">{row.client}</TableCell>
                  <TableCell className="py-2 text-sm text-muted-foreground">{row.client}</TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums">${(row.revenue / 1000).toFixed(1)}k</TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums">${(row.labor / 1000).toFixed(1)}k</TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums">${(row.supplies / 1000).toFixed(1)}k</TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums">$0</TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums">{row.marginPct}%</TableCell>
                  <TableCell className="py-2 text-sm">—</TableCell>
                  <TableCell className="py-2">
                    <span
                      className={`h-2 w-2 rounded-full block ${
                        row.health === 'green' ? 'bg-health-green' : row.health === 'amber' ? 'bg-health-amber' : 'bg-health-red'
                      }`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Row click opens Site Finance Drawer. Default sort: GM% ascending (fires first).
      </p>
    </div>
  );
}
