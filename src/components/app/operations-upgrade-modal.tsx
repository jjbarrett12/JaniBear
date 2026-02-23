'use client';

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Rocket, ClipboardCheck, Users, Calendar } from 'lucide-react';

export const OPERATIONS_UPGRADE_TOOLTIP = 'Available in Grizzly plan. Automate service execution and quality control.';

export interface OperationsUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperationsUpgradeModal({ open, onOpenChange }: OperationsUpgradeModalProps) {
  const router = useRouter();
  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={() => onOpenChange(false)} onEscapeKeyDown={() => onOpenChange(false)} className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Lock className="h-5 w-5" />
            <DialogTitle className="text-xl">Unlock Operations</DialogTitle>
          </div>
          <DialogDescription>
            Operations is available on the <strong>Grizzly</strong> plan. Automate service execution and quality control.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-muted-foreground py-2">
          <li className="flex items-center gap-2"><Rocket className="h-4 w-4 text-emerald-500 shrink-0" /> Launch queue</li>
          <li className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-500 shrink-0" /> Inspections & QC</li>
          <li className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-500 shrink-0" /> Crew management</li>
          <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-500 shrink-0" /> SLA tracking</li>
        </ul>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Maybe later</Button>
          <Button onClick={handleUpgrade}>See Grizzly plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
