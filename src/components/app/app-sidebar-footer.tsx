'use client';


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
        <p className="text-[11px] text-foreground/80 truncate mb-1.5 px-1 dark:text-foreground/75">
          {userEmail}
        </p>
      )}
      <a
        href="/auth/logout"
        className="text-xs font-medium text-foreground/85 hover:text-foreground transition-colors px-1 block dark:text-foreground/80"
      >
        {t('signOut')}
      </a>
    </div>
  );
}
