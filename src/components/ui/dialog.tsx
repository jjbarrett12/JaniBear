'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  return <>{open ? children : null}</>;
}

function DialogTrigger({
  asChild,
  children,
  onClick,
  ...props
}: {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      ...props,
      onClick: (e: React.MouseEvent) => {
        onClick?.();
        (children as React.ReactElement<{ onClick?: () => void }>).props?.onClick?.(e);
      },
    });
  }
  return (
    <button type="button" onClick={onClick} {...props}>
      {children}
    </button>
  );
}

function DialogContent({
  className,
  children,
  onPointerDownOutside,
  onEscapeKeyDown,
}: {
  className?: string;
  children: React.ReactNode;
  onPointerDownOutside?: () => void;
  onEscapeKeyDown?: () => void;
}) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscapeKeyDown?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscapeKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        aria-hidden
        onClick={onPointerDownOutside}
      />
      <div
        role="dialog"
        aria-modal
        className={cn('relative z-50 bg-background rounded-lg shadow-lg max-h-[90vh] overflow-auto', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-2', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-2', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
