'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error('Sheet components must be used within Sheet');
  return ctx;
}

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  const [openState, setOpenState] = React.useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : openState;
  const setIsOpen = isControlled ? onOpenChange! : setOpenState;

  const value: SheetContextValue = {
    open: isOpen,
    onOpenChange: setIsOpen,
  };

  return (
    <SheetContext.Provider value={value}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
  onEscapeKeyDown?: () => void;
  onPointerDownOutside?: () => void;
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  (
    {
      side = 'right',
      showCloseButton = true,
      className,
      children,
      onEscapeKeyDown,
      onPointerDownOutside,
      ...props
    },
    ref
  ) => {
    const { open, onOpenChange } = useSheet();

    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onEscapeKeyDown?.();
          onOpenChange(false);
        }
      };
      if (open) {
        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
      }
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [open, onOpenChange, onEscapeKeyDown]);

    if (!open) return null;

    const content = (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          aria-hidden
          onClick={() => {
            onPointerDownOutside?.();
            onOpenChange(false);
          }}
        />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          data-side={side}
            className={cn(
            'fixed z-50 flex h-full w-full max-w-lg flex-col gap-0 bg-background shadow-xl',
            side === 'right' && 'inset-y-0 right-0 border-l border-border sheet-animate-in-right',
            side === 'left' && 'inset-y-0 left-0 border-r border-border',
            side === 'top' && 'inset-x-0 top-0 border-b border-border',
            side === 'bottom' && 'inset-x-0 bottom-0 border-t border-border',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 h-8 w-8 rounded-md"
              onClick={() => onOpenChange(false)}
              aria-label="Close panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {children}
        </div>
      </>
    );

    if (typeof document !== 'undefined') {
      return createPortal(content, document.body);
    }
    return content;
  }
);
SheetContent.displayName = 'SheetContent';

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shrink-0 flex flex-col gap-1.5 border-b border-border px-6 py-4', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shrink-0 flex flex-col-reverse gap-2 border-t border-border px-6 py-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function SheetClose({
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { onOpenChange } = useSheet();
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => onOpenChange(false),
    });
  }
  return (
    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} {...props}>
      {children}
    </Button>
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, useSheet };
