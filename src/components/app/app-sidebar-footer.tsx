'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';

export function AppSidebarFooter({
  userEmail,
}: {
  userEmail?: string | null;
}) {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  return (
    <div className="border-t border-border px-3 py-2.5">
      {userEmail && (
        <p className="text-[11px] text-muted-foreground truncate mb-1.5 px-1">
          {userEmail}
        </p>
      )}
      <Link
        href="/auth/logout"
        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-1 block"
      >
        {t('signOut')}
      </Link>
    </div>
  );
}
