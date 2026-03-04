'use client';

import { Button } from '@/components/ui/button';
import { UserX } from 'lucide-react';
import { clearImpersonation } from '@/actions/platform';

export function ImpersonationBanner({
  orgName,
  onExit,
}: {
  orgName: string;
  onExit?: () => void;
}) {
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-4">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <UserX className="h-4 w-4 shrink-0" />
        Impersonating: <span className="font-semibold">{orgName}</span>
      </p>
      <form action={clearImpersonation}>
        <Button type="submit" variant="outline" size="sm" className="shrink-0 border-amber-500/50 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20">
          Exit
        </Button>
      </form>
    </div>
  );
}
