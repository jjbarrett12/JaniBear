'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Button } from '@/components/ui/button';

export function AppSidebarFooter({
  userEmail,
}: {
  userEmail?: string | null;
}) {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  return (
    <div className="border-t border-border p-4">
      {userEmail && (
        <div className="mb-4 px-3 text-sm text-muted-foreground truncate">
          {userEmail}
        </div>
      )}
      <Button asChild variant="outline" className="w-full h-12 text-base">
        <Link href="/auth/logout">{t('signOut')}</Link>
      </Button>
    </div>
  );
}
