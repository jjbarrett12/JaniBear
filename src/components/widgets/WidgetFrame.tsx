'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GripVertical, MoreVertical, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetFrameProps {
  widgetId: string;
  title: string;
  editMode: boolean;
  onRemove?: () => void;
  onResetSize?: () => void;
  children: ReactNode;
  className?: string;
}

export function WidgetFrame({
  title,
  editMode,
  onRemove,
  onResetSize,
  children,
  className,
}: WidgetFrameProps) {
  return (
    <div
      className={cn(
        'h-full flex flex-col overflow-hidden min-h-0',
        editMode && 'rounded-2xl ring-2 ring-primary/30 border border-primary/40',
        className
      )}
    >
      {editMode && (
        <div
          data-widget-drag-handle
          className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/40 cursor-grab active:cursor-grabbing rounded-t-2xl"
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-xs font-medium truncate">{title}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
                aria-label="Widget menu"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRemove && (
                <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                  Remove widget
                </DropdownMenuItem>
              )}
              {onResetSize && (
                <DropdownMenuItem onClick={onResetSize}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset size
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <div className={cn('flex-1 overflow-auto min-h-0', editMode && 'p-2')}>
        {children}
      </div>
    </div>
  );
}
