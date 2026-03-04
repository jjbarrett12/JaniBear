'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, RotateCcw } from 'lucide-react';
import type { LayoutMode } from '@/lib/ui/layouts';
import {
  TOOLTIP_MY_LAYOUT,
  TOOLTIP_RECOMMENDED,
  TOOLTIP_ORG_TEMPLATE,
  EMPTY_ORG_TEMPLATE,
  RESTORE_DEFAULT_LABEL,
  RESTORE_DEFAULT_TOOLTIP,
  BADGE_RECOMMENDED_PREFIX,
} from './layout-selector-copy';
const MODE_LABELS: Record<LayoutMode, string> = {
  my: 'My Layout',
  recommended: 'Recommended',
  org_template: 'Org Template',
};

export interface LayoutModeSelectorProps {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
  hasOrgTemplate: boolean;
  /** e.g. "Ops Manager" — used for badge when value === 'recommended' */
  roleLabel?: string | null;
  disabled?: boolean;
  onRestoreDefault?: () => void;
}

export function LayoutModeSelector({
  value,
  onChange,
  hasOrgTemplate,
  roleLabel,
  disabled,
  onRestoreDefault,
}: LayoutModeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <Select
          value={value}
          onValueChange={(v) => onChange(v as LayoutMode)}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-[160px]"
            title={
              value === 'my'
                ? TOOLTIP_MY_LAYOUT
                : value === 'recommended'
                  ? TOOLTIP_RECOMMENDED
                  : TOOLTIP_ORG_TEMPLATE
            }
          >
            <SelectValue placeholder="Layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my" title={TOOLTIP_MY_LAYOUT}>
              {MODE_LABELS.my}
            </SelectItem>
            <SelectItem value="recommended" title={TOOLTIP_RECOMMENDED}>
              {MODE_LABELS.recommended}
            </SelectItem>
            {hasOrgTemplate && (
              <SelectItem value="org_template" title={TOOLTIP_ORG_TEMPLATE}>
                {MODE_LABELS.org_template}
              </SelectItem>
            )}
            {!hasOrgTemplate && (
              <div className="px-2 py-2 text-xs text-muted-foreground border-t border-border mt-1 pt-2">
                {EMPTY_ORG_TEMPLATE}
              </div>
            )}
          </SelectContent>
        </Select>
        {value === 'recommended' && roleLabel && (
          <Badge variant="secondary" className="text-xs font-normal shrink-0">
            {BADGE_RECOMMENDED_PREFIX} {roleLabel}
          </Badge>
        )}
      </div>
      {onRestoreDefault && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={disabled}
              aria-label="Layout options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onRestoreDefault}
              title={RESTORE_DEFAULT_TOOLTIP}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {RESTORE_DEFAULT_LABEL}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
