'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PEER_GROUP_SELECTOR_LABEL,
  PEER_GROUP_SELECTOR_DESCRIPTION,
  VERTICAL_LABEL,
  COMPANY_SIZE_LABEL,
  REGION_LABEL,
  REGION_COMING_SOON,
  VERTICAL_OPTIONS,
  COMPANY_SIZE_OPTIONS,
} from '@/lib/benchmark-copy';

export interface PeerGroupSelectorProps {
  vertical: string;
  companySize: string;
  region?: string;
  onVerticalChange: (value: string) => void;
  onCompanySizeChange: (value: string) => void;
  onRegionChange?: (value: string) => void;
  disabled?: boolean;
}

export function PeerGroupSelector({
  vertical,
  companySize,
  region = '',
  onVerticalChange,
  onCompanySizeChange,
  onRegionChange,
  disabled,
}: PeerGroupSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{PEER_GROUP_SELECTOR_LABEL}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{PEER_GROUP_SELECTOR_DESCRIPTION}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{VERTICAL_LABEL}</Label>
          <Select value={vertical || 'all'} onValueChange={(v) => onVerticalChange(v === 'all' ? '' : v)} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Vertical" />
            </SelectTrigger>
            <SelectContent>
              {VERTICAL_OPTIONS.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value || 'all'}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{COMPANY_SIZE_LABEL}</Label>
          <Select value={companySize || 'all'} onValueChange={(v) => onCompanySizeChange(v === 'all' ? '' : v)} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Company size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS.map((o) => (
                <SelectItem key={o.value || 'all'} value={o.value || 'all'}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{REGION_LABEL}</Label>
          <Select value="all" disabled>
            <SelectTrigger className="h-9">
              <SelectValue>{REGION_COMING_SOON}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{REGION_COMING_SOON}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
