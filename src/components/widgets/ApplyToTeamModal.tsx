'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  APPLY_TO_TEAM_TITLE,
  APPLY_TO_TEAM_DESCRIPTION,
  APPLY_TO_TEAM_PUSH_LABEL,
  APPLY_TO_TEAM_CONFIRM,
} from './layout-selector-copy';

export interface ApplyToTeamModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (pushToUsers: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function ApplyToTeamModal({
  open,
  onClose,
  onConfirm,
  isLoading,
}: ApplyToTeamModalProps) {
  const [pushToUsers, setPushToUsers] = useState(false);
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

  const handleApply = async () => {
    await onConfirm(pushToUsers);
    onClose();
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
        aria-labelledby="apply-to-team-title"
        aria-describedby="apply-to-team-desc"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id="apply-to-team-title" className="text-lg font-semibold text-foreground">
          {APPLY_TO_TEAM_TITLE}
        </h2>
        <p id="apply-to-team-desc" className="mt-2 text-sm text-muted-foreground">
          {APPLY_TO_TEAM_DESCRIPTION}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Checkbox
            id="apply-push-to-users"
            checked={pushToUsers}
            onCheckedChange={(v) => setPushToUsers(v === true)}
            disabled={isLoading}
          />
          <Label htmlFor="apply-push-to-users" className="font-normal cursor-pointer text-sm">
            {APPLY_TO_TEAM_PUSH_LABEL}
          </Label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button ref={focusRef} size="sm" onClick={handleApply} disabled={isLoading}>
            {isLoading ? 'Applying…' : APPLY_TO_TEAM_CONFIRM}
          </Button>
        </div>
      </div>
    </>
  );
}
