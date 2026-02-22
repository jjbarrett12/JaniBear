'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SAVE_AS_ORG_TEMPLATE_TITLE,
  SAVE_AS_ORG_TEMPLATE_DESCRIPTION,
  SAVE_AS_ORG_TEMPLATE_NAME_LABEL,
  SAVE_AS_ORG_TEMPLATE_CONFIRM,
} from './layout-selector-copy';

export interface SaveAsOrgTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  isLoading?: boolean;
  defaultName?: string;
}

export function SaveAsOrgTemplateModal({
  open,
  onClose,
  onSave,
  isLoading,
  defaultName = '',
}: SaveAsOrgTemplateModalProps) {
  const [name, setName] = useState(defaultName);
  const focusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

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

  const handleSubmit = async () => {
    await onSave(name.trim() || 'Org template');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" aria-hidden onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-org-template-title"
        aria-describedby="save-org-template-desc"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id="save-org-template-title" className="text-lg font-semibold text-foreground">
          {SAVE_AS_ORG_TEMPLATE_TITLE}
        </h2>
        <p id="save-org-template-desc" className="mt-2 text-sm text-muted-foreground">
          {SAVE_AS_ORG_TEMPLATE_DESCRIPTION}
        </p>
        <div className="mt-4">
          <Label htmlFor="org-template-name">{SAVE_AS_ORG_TEMPLATE_NAME_LABEL}</Label>
          <Input
            id="org-template-name"
            ref={focusRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ops Standard v1"
            className="mt-2"
            disabled={isLoading}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Saving…' : SAVE_AS_ORG_TEMPLATE_CONFIRM}
          </Button>
        </div>
      </div>
    </>
  );
}
