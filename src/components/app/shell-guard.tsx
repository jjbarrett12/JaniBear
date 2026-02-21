'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ShellKey } from '@/lib/shell';

/**
 * Server-side shell is enforced in layout; this redirects franchisor from operator paths when they hit them client-side.
 */
export function ShellGuard({ shell }: { shell: ShellKey }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (shell !== 'franchisor') return;
    if (pathname.startsWith('/app/franchise')) return;
    if (pathname === '/app/settings' || pathname.startsWith('/app/settings/')) return;
    if (pathname.startsWith('/app/')) {
      router.replace('/app/franchise');
    }
  }, [shell, pathname, router]);

  return null;
}
