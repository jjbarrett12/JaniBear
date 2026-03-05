'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/** Renders Footer only on non-auth routes so /auth/login, /auth/signup, etc. show a clean full-screen form. */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (!pathname) return null;
  if (pathname.startsWith('/auth/')) return null;
  return <Footer />;
}
