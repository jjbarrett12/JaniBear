'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Building2, MapPin, FileText, Info } from 'lucide-react';
import { FINANCE_DATE_PRESETS } from '@/lib/financial-health-mock';

export type FinanceDatePreset = (typeof FINANCE_DATE_PRESETS)[number];
export type ViewMode = 'cash' | 'accrual';

export interface FinancialHealthHeaderFilters {
  datePreset: FinanceDatePreset;
  clientSearch: string;
  locationSearch: string;
  serviceLine: string | null;
  viewMode: ViewMode;
}

export const defaultHeaderFilters: FinancialHealthHeaderFilters = {
  datePreset: '90D',
  clientSearch: '',
  locationSearch: '',
  serviceLine: null,
  viewMode: 'accrual',
};

interface FinancialHealthHeaderProps {
  filters: FinancialHealthHeaderFilters;
  onChange: (f: FinancialHealthHeaderFilters) => void;
  /** Optional: clients for combobox (searchable). If empty, show simple input. */
  clientOptions?: { id: string; name: string }[];
  /** Optional: locations for combobox. If empty, show simple input. */
  locationOptions?: { id: string; name: string }[];
}

export function FinancialHealthHeader({
  filters,
  onChange,
  clientOptions = [],
  locationOptions = [],
}: FinancialHealthHeaderProps) {
  const set = (patch: Partial<FinancialHealthHeaderFilters>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <header className="border-b border-border pb-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-semibold tracking-tight text-foreground sm:text-3xl">
              Financial Health
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mt-0.5">
              Profitability by contract/site, margin leaks, AR, costs, and what to do next.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-1 py-0.5">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select
                value={filters.datePreset}
                onValueChange={(v: FinanceDatePreset) => set({ datePreset: v })}
              >
                <SelectTrigger className="w-[90px] h-8 border-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINANCE_DATE_PRESETS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Client"
                value={filters.clientSearch}
                onChange={(e) => set({ clientSearch: e.target.value })}
                className="h-8 w-[120px] sm:w-[140px]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Location / Site"
                value={filters.locationSearch}
                onChange={(e) => set({ locationSearch: e.target.value })}
                className="h-8 w-[120px] sm:w-[140px]"
              />
            </div>
            <Select
              value={filters.serviceLine ?? 'all'}
              onValueChange={(v) => set({ serviceLine: v === 'all' ? null : v })}
            >
              <SelectTrigger className="w-[100px] h-8">
                <FileText className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-1.5 py-0.5">
              <span className="text-xs text-muted-foreground">View:</span>
              <Button
                variant={filters.viewMode === 'cash' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                disabled
                title="Coming soon"
              >
                Cash
              </Button>
              <Button
                variant={filters.viewMode === 'accrual' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => set({ viewMode: 'accrual' })}
              >
                Accrual
              </Button>
            </div>
          </div>
        </div>
        {/* Data integrity micro-row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            Data integrity:
          </span>
          <Badge variant="outline" className="font-normal text-xs py-0">
            Invoices: Internal
          </Badge>
          <Badge variant="outline" className="font-normal text-xs py-0">
            Labor: Timesheets / Labor entries
          </Badge>
          <Badge variant="outline" className="font-normal text-xs py-0">
            Supplies: Purchases / Allocations
          </Badge>
          <Badge variant="outline" className="font-normal text-xs py-0 border-amber-500/50 text-amber-700 dark:text-amber-400">
            Accounting Sync: Not connected
          </Badge>
        </div>
      </div>
    </header>
  );
}
