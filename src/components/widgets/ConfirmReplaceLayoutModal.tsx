'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  REPLACE_MODAL_TITLE,
  REPLACE_MODAL_DESCRIPTION,
  REPLACE_MODAL_CONFIRM,
  REPLACE_MODAL_CANCEL,
} from './layout-selector-copy';
export interface ConfirmReplaceLayoutModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmReplaceLayoutModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: ConfirmReplaceLayoutModalProps) {
  const focusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => focusRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-replace-title"
        aria-describedby="confirm-replace-desc"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id="confirm-replace-title" className="text-lg font-semibold text-foreground">
          {REPLACE_MODAL_TITLE}
        </h2>
        <p id="confirm-replace-desc" className="mt-2 text-sm text-muted-foreground">
          {REPLACE_MODAL_DESCRIPTION}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {REPLACE_MODAL_CANCEL}
          </Button>
          <Button
            ref={focusRef}
            size="sm"
            onClick={async () => {
              await Promise.resolve(onConfirm());
              onClose();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Saving…' : REPLACE_MODAL_CONFIRM}
          </Button>
        </div>
      </div>
    </>
  );
}
