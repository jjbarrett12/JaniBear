'use client';

import { useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { setOrgShell } from '@/actions/platform';
import { SHELL_LABELS, type ShellKey } from '@/lib/shell';
import { Building2, Briefcase, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const SHELL_OPTIONS: { value: ShellKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'owner_operator', label: SHELL_LABELS.owner_operator, icon: Building2 },
  { value: 'franchisee', label: SHELL_LABELS.franchisee, icon: Briefcase },
  { value: 'franchisor', label: SHELL_LABELS.franchisor, icon: LayoutDashboard },
];

export function ShellSelector({
  orgId,
  currentShell,
}: {
  orgId: string;
  currentShell: ShellKey;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  function onSelect(shell: ShellKey) {
    if (shell === currentShell) return;
    startTransition(async () => {
      const result = await setOrgShell(orgId, shell);
      if (result?.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Dashboard experience updated',
        description: `Set to ${result?.label ?? shell}`,
      });
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Dashboard experience</p>
      <p className="text-xs text-muted-foreground">Only one can be selected. Only platform admin can change.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {SHELL_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = currentShell === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isPending}
              onClick={() => onSelect(opt.value)}
              className={cn(
                'text-left rounded-lg border-2 p-4 transition-colors disabled:opacity-50',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
              )}
              aria-pressed={isSelected}
              role="radio"
              aria-checked={isSelected}
            >
              <Icon className="h-5 w-5 mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{opt.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
