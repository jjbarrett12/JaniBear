'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SlideOverDrawer({
  open,
  onClose,
  title,
  children,
  width = 'max-w-md',
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-hidden border-l border-border bg-card shadow-lg transition-transform duration-150 ease-out',
          width,
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title != null || onClose) && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
            {title != null && (
              <h2 className="text-lg font-semibold tracking-tight text-foreground truncate">
                {title}
              </h2>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </aside>
    </>
  );
}
