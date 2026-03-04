'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function OpsLaunchesFilters({
  blockedOnly,
  notOpsReady,
  myPlansOnly,
}: {
  blockedOnly: boolean;
  notOpsReady: boolean;
  myPlansOnly?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = '/app/ops/launches';

  const setFilter = (key: 'blocked' | 'not_ops_ready' | 'ops_owner', value: boolean) => {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    if (key === 'ops_owner') {
      if (value) p.set('ops_owner', 'me');
      else p.delete('ops_owner');
    } else if (value) p.set(key, '1');
    else p.delete(key);
    const q = p.toString();
    router.push(pathname + (q ? `?${q}` : ''));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={blockedOnly ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter('blocked', !blockedOnly)}
      >
        Blocked only
      </Button>
      <Button
        variant={notOpsReady ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter('not_ops_ready', !notOpsReady)}
      >
        Not ops ready
      </Button>
      <Button
        variant={myPlansOnly ? 'default' : 'outline'}
        size="sm"
        onClick={() => setFilter('ops_owner', !myPlansOnly)}
      >
        My plans (ops owner)
      </Button>
    </div>
  );
}
