'use client';

import Link from 'next/link';
import { X, FileText, Scan, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BUILDING_INTEL_FIELD_SPEC } from '@/lib/sales/territory/salesTerritoryConfig';
import type { BuildingIntel } from '@/lib/sales/territory/types';
import { cn } from '@/lib/utils';

const UNKNOWN = 'Unknown';

function formatIntelValue(key: keyof BuildingIntel, value: unknown): string {
  if (value == null || value === '') return UNKNOWN;
  switch (key) {
    case 'sqft':
      return typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : String(value);
    case 'estValueMonthly':
      return typeof value === 'number'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
        : String(value);
    case 'marginPotentialPct':
      return typeof value === 'number' ? `${value}%` : String(value);
    case 'similarWinsInZip':
      return typeof value === 'number' ? String(value) : String(value);
    case 'riskScore':
      if (value === 'low') return 'Low';
      if (value === 'medium') return 'Medium';
      if (value === 'high') return 'High';
      return String(value);
    default:
      return String(value);
  }
}

interface Props {
  intel: BuildingIntel;
  onClose: () => void;
  className?: string;
}

export function BuildingIntelCard({ intel, onClose, className }: Props) {
  const rows = BUILDING_INTEL_FIELD_SPEC.map(({ key, label }) => ({
    key,
    label,
    value: formatIntelValue(key, intel[key]),
  }));

  return (
    <div
      className={cn(
        'absolute z-[1000] w-full max-w-sm rounded-xl border border-white/20 bg-zinc-900/95 shadow-xl backdrop-blur-sm',
        'ring-1 ring-white/10',
        className
      )}
    >
      <div className="flex items-start justify-between border-b border-white/10 p-4">
        <h3 className="text-base font-semibold text-white truncate pr-8">{intel.name || UNKNOWN}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 hover:text-white hover:bg-white/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 border-b border-white/10">
        {rows.map(({ key, label, value }) => (
          <div key={key} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
            <span className="text-sm text-zinc-200">{value}</span>
          </div>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <Link href={`/app/sales/scope?buildingId=${encodeURIComponent(intel.id)}`}>
          <Button className="w-full justify-center gap-2" size="sm">
            <FileText className="h-4 w-4" />
            Generate AI Proposal
          </Button>
        </Link>
        <Link href={`/app/sales/walkthroughs/new?buildingId=${encodeURIComponent(intel.id)}`}>
          <Button variant="outline" className="w-full justify-center gap-2 border-white/20" size="sm">
            <Scan className="h-4 w-4" />
            Launch LiDAR Walkthrough
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full justify-center gap-2 border-white/20"
          size="sm"
          onClick={() => {
            // Stub: Log Visit – would create visit activity
            alert('Visit logged (stub). Wire to activity API.');
          }}
        >
          <Calendar className="h-4 w-4" />
          Log Visit
        </Button>
        <Link href={`/app/sales/cadence?buildingId=${encodeURIComponent(intel.id)}`}>
          <Button variant="outline" className="w-full justify-center gap-2 border-white/20" size="sm">
            <Zap className="h-4 w-4" />
            Add Follow-up Sequence
          </Button>
        </Link>
      </div>
    </div>
  );
}
