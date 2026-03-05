'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

/**
 * Use for links inside the dashboard (/app/*). Renders Next.js Link for
 * client-side navigation so the app shell stays mounted and marketing
 * layout (footer) never flashes. Prefer this over raw <a> or window.location.
 */
export function AppLink({ href, onClick, children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link href={href} onClick={onClick} {...props}>
      {children}
    </Link>
  );
}
