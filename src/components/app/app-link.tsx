'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

/**
 * Use for links inside /app that must send cookies. Client-side navigation's
 * RSC fetch can omit cookies on some hosts; full page load always sends them.
 * Renders a normal Link but on click does a full navigation for /app/* hrefs.
 */
export function AppLink({ href, onClick, children, ...props }: ComponentProps<typeof Link>) {
  const pathname = typeof href === 'string' ? href : href?.pathname ?? '';
  const isAppRoute = pathname.startsWith('/app/');

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) (onClick as (e: React.MouseEvent<HTMLAnchorElement>) => void)(e);
    if (e.defaultPrevented) return;
    if (isAppRoute && pathname) {
      e.preventDefault();
      window.location.href = pathname;
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
