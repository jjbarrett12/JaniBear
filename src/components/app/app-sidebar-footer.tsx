'use client';

import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Button } from '@/components/ui/button';

export function AppSidebarFooter({
  userEmail,
  signOutAction,
}: {
  userEmail?: string | null;
  signOutAction: () => void;
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
      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full h-12 text-base">
          {t('signOut')}
        </Button>
      </form>
    </div>
  );
}
