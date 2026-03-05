import { Suspense } from 'react';
import UpgradeSuccessClient from './upgrade-success-client';

export const dynamic = 'force-dynamic';

export default function UpgradeSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <UpgradeSuccessClient />
    </Suspense>
  );
}
