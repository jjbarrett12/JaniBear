'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SAVE_AS_TEMPLATE_MODAL_TITLE,
  SAVE_AS_TEMPLATE_MODAL_DESCRIPTION,
  SAVE_AS_TEMPLATE_NAME_LABEL,
  SAVE_AS_TEMPLATE_NAME_PLACEHOLDER,
  SAVE_AS_TEMPLATE_ROLE_LABEL,
  SAVE_AS_TEMPLATE_ROLE_DESCRIPTION,
  SAVE_AS_TEMPLATE_LOCK_LABEL,
  SAVE_AS_TEMPLATE_LOCK_DESCRIPTION,
  SAVE_AS_TEMPLATE_APPLY_NOW_LABEL,
  SAVE_AS_TEMPLATE_APPLY_NOW_DESCRIPTION,
  SAVE_AS_TEMPLATE_CONFIRM,
  SAVE_AS_TEMPLATE_CANCEL,
} from './layout-selector-copy';
import { TEMPLATE_ROLES, getRoleDisplayLabel } from '@/lib/ui/layouts';
import type { TemplateRoleKey } from '@/lib/ui/layouts';

export interface SaveAsTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (params: {
    name: string;
    role: TemplateRoleKey;
    isLocked: boolean;
    applyNow: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
  defaultName?: string;
  defaultRole?: TemplateRoleKey;
  defaultLock?: boolean;
}

export function SaveAsTemplateModal({
  open,
  onClose,
  onSave,
  isLoading,
  defaultName = '',
  defaultRole = 'manager',
  defaultLock = false,
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState(defaultName);
  const [role, setRole] = useState<TemplateRoleKey>(defaultRole);
  const [isLocked, setIsLocked] = useState(defaultLock);
  const [applyNow, setApplyNow] = useState(false);
  const focusRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setRole(defaultRole);
      setIsLocked(defaultLock);
      setApplyNow(false);
    }
  }, [open, defaultName, defaultRole, defaultLock]);

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
    try {
      await onSave({
        name: name.trim() || 'Org template',
        role,
        isLocked,
        applyNow,
      });
      onClose();
    } catch {
      // Leave modal open on error so user can fix or retry
    }
  };

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
        aria-labelledby="save-as-template-title"
        aria-describedby="save-as-template-desc"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id="save-as-template-title" className="text-lg font-semibold text-foreground">
          {SAVE_AS_TEMPLATE_MODAL_TITLE}
        </h2>
        <p id="save-as-template-desc" className="mt-2 text-sm text-muted-foreground">
          {SAVE_AS_TEMPLATE_MODAL_DESCRIPTION}
        </p>

        <div className="mt-4">
          <Label htmlFor="save-template-name">{SAVE_AS_TEMPLATE_NAME_LABEL}</Label>
          <Input
            id="save-template-name"
            ref={focusRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={SAVE_AS_TEMPLATE_NAME_PLACEHOLDER}
            className="mt-2"
            disabled={isLoading}
          />
        </div>

        <div className="mt-4">
          <Label>{SAVE_AS_TEMPLATE_ROLE_LABEL}</Label>
          <p className="text-xs text-muted-foreground mt-0.5">{SAVE_AS_TEMPLATE_ROLE_DESCRIPTION}</p>
          <Select value={role} onValueChange={(v) => setRole(v as TemplateRoleKey)} disabled={isLoading}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {getRoleDisplayLabel(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <Checkbox
            id="save-template-lock"
            checked={isLocked}
            onCheckedChange={(c) => setIsLocked(c === true)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <div className="grid gap-0.5">
            <Label htmlFor="save-template-lock" className="font-medium cursor-pointer">
              {SAVE_AS_TEMPLATE_LOCK_LABEL}
            </Label>
            <p className="text-xs text-muted-foreground">{SAVE_AS_TEMPLATE_LOCK_DESCRIPTION}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <Checkbox
            id="save-template-apply-now"
            checked={applyNow}
            onCheckedChange={(c) => setApplyNow(c === true)}
            disabled={isLoading}
            className="mt-0.5"
          />
          <div className="grid gap-0.5">
            <Label htmlFor="save-template-apply-now" className="font-medium cursor-pointer">
              {SAVE_AS_TEMPLATE_APPLY_NOW_LABEL}
            </Label>
            <p className="text-xs text-muted-foreground">{SAVE_AS_TEMPLATE_APPLY_NOW_DESCRIPTION}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {SAVE_AS_TEMPLATE_CANCEL}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving…' : SAVE_AS_TEMPLATE_CONFIRM}
          </Button>
        </div>
      </div>
    </>
  );
}
