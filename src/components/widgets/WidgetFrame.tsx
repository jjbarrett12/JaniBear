'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ElevatedCard } from '@/components/ui/elevated-card';
import { GripVertical, MoreVertical, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetFrameProps {
  widgetId: string;
  title: string;
  editMode: boolean;
  /** Only in customize mode; when true, widget shows accent glow (e.g. while dragging). */
  accent?: boolean;
  collapsed?: boolean;
  onCollapsedToggle?: () => void;
  onRemove?: () => void;
  onResetSize?: () => void;
  children: ReactNode;
  className?: string;
}

export function WidgetFrame({
  title,
  editMode,
  accent,
  collapsed = false,
  onCollapsedToggle,
  onRemove,
  onResetSize,
  children,
  className,
}: WidgetFrameProps) {
  return (
    <ElevatedCard
      accent={accent}
      className={cn(
        'h-full flex flex-col overflow-hidden min-h-0',
        className
      )}
    >
      {/* Title row: left = title, right = actions (drag handle, collapse, menu with remove/reset) */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/8 min-h-[44px] shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {editMode && (
            <div
              data-widget-drag-handle
              className="cursor-grab active:cursor-grabbing touch-none flex items-center justify-center p-0.5 rounded text-muted-foreground hover:text-foreground"
              aria-hidden
            >
              <GripVertical className="h-4 w-4 shrink-0" />
            </div>
          )}
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onCollapsedToggle != null && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onCollapsedToggle();
              }}
              aria-label={collapsed ? 'Expand widget' : 'Collapse widget'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          {(onRemove != null || onResetSize != null) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Widget menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onRemove != null && (
                  <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                    Remove widget
                  </DropdownMenuItem>
                )}
                {onResetSize != null && (
                  <DropdownMenuItem onClick={onResetSize}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset size
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className={cn('flex-1 overflow-auto min-h-0', editMode && 'p-2')}>
          {children}
        </div>
      )}
    </ElevatedCard>
  );
}
