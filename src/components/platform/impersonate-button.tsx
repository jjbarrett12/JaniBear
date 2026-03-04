'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { UserCog } from 'lucide-react';
import { setImpersonateOrg } from '@/actions/platform';

export function ImpersonateButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          setImpersonateOrg(orgId);
        });
      }}
    >
      <UserCog className="h-4 w-4 mr-2" />
      Impersonate
    </Button>
  );
}
