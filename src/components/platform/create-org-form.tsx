'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createOrg } from '@/actions/platform';
import { SHELL_LABELS, type ShellKey } from '@/lib/shell';
import { Building2, Briefcase, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const SHELL_OPTIONS: { value: ShellKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'owner_operator', label: SHELL_LABELS.owner_operator, icon: Building2 },
  { value: 'franchisee', label: SHELL_LABELS.franchisee, icon: Briefcase },
  { value: 'franchisor', label: SHELL_LABELS.franchisor, icon: LayoutDashboard },
];

export function CreateOrgForm() {
  const [shell, setShell] = useState<ShellKey>('owner_operator');
  const [state, formAction] = useActionState(createOrg, {} as { error?: string });

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Organization name</Label>
        <Input id="name" name="name" required placeholder="Acme Inc." />
      </div>
      <div className="space-y-2">
        <Label>Dashboard experience</Label>
        <p className="text-xs text-muted-foreground">Pick one. Only platform admin can change later.</p>
        <input type="hidden" name="shell" value={shell} />
        <div className="grid gap-2 sm:grid-cols-3">
          {SHELL_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = shell === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setShell(opt.value)}
                className={cn(
                  'text-left rounded-lg border-2 p-3 transition-colors',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                )}
                aria-pressed={isSelected}
                role="radio"
              >
                <Icon className="h-4 w-4 mb-1 text-muted-foreground" />
                <p className="text-sm font-medium">{opt.label}</p>
              </button>
            );
          })}
        </div>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit">Create</Button>
    </form>
  );
}
