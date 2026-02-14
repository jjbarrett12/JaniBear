'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DATE_RANGES } from '@/lib/financial-health-mock';
import { Calendar, Building2, MapPin, FileText } from 'lucide-react';

export interface FinancialHealthFiltersState {
  dateRange: string;
  orgId: string | null;
  locationId: string | null;
  contractType: string | null;
  includeOwnerSalary: boolean;
  cashVsAccrual: 'cash' | 'accrual';
}

const defaultFilters: FinancialHealthFiltersState = {
  dateRange: 'Last 12 months',
  orgId: null,
  locationId: null,
  contractType: null,
  includeOwnerSalary: false,
  cashVsAccrual: 'accrual',
};

interface DashboardFiltersProps {
  filters: FinancialHealthFiltersState;
  onChange: (f: FinancialHealthFiltersState) => void;
  showOrgSelector?: boolean;
  orgs?: { id: string; name: string }[];
  locations?: { id: string; name: string }[];
}

export function DashboardFilters({
  filters,
  onChange,
  showOrgSelector = false,
  orgs = [],
  locations = [],
}: DashboardFiltersProps) {
  const set = (patch: Partial<FinancialHealthFiltersState>) => {
    onChange({ ...filters, ...patch });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-2">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.dateRange}
          onValueChange={(v) => set({ dateRange: v })}
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showOrgSelector && orgs.length > 0 && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.orgId ?? 'all'}
            onValueChange={(v) => set({ orgId: v === 'all' ? null : v })}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All franchisees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All franchisees</SelectItem>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {locations.length > 0 && (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.locationId ?? 'all'}
            onValueChange={(v) => set({ locationId: v === 'all' ? null : v })}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Select
        value={filters.contractType ?? 'all'}
        onValueChange={(v) => set({ contractType: v === 'all' ? null : v })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <FileText className="h-4 w-4 text-muted-foreground mr-1" />
          <SelectValue placeholder="Contract type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="recurring">Recurring</SelectItem>
          <SelectItem value="one-time">One-time</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-4 ml-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.includeOwnerSalary}
            onChange={(e) => set({ includeOwnerSalary: e.target.checked })}
            className="rounded border-input"
          />
          <span className="text-sm text-muted-foreground">Include owner salary</span>
        </label>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Basis</Label>
          <Select
            value={filters.cashVsAccrual}
            onValueChange={(v: 'cash' | 'accrual') => set({ cashVsAccrual: v })}
          >
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="accrual">Accrual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

export { defaultFilters };
