'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MapPin, 
  FileText, 
  Calendar, 
  ClipboardCheck, 
  AlertCircle,
  Users,
  FileUp,
  Calculator,
  Settings,
  X,
  Menu,
  TrendingUp,
  ListChecks,
  Package,
  GraduationCap,
  Ticket,
  Repeat,
  KeyRound,
  Award,
  FileSearch,
  MessageCircle
} from 'lucide-react';
import { GlobalSearch } from '@/components/search/global-search';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import type { AppTranslationKey } from '@/lib/app-translations';

interface MobileSidebarProps {
  logoUrl?: string | null;
}

const salesItemKeys: { href: string; labelKey: AppTranslationKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/app/sales', labelKey: 'navLeads', icon: TrendingUp },
  { href: '/app/walkthroughs', labelKey: 'navSalesAppointment', icon: FileSearch },
  { href: '/app/bids', labelKey: 'navProposalBuilding', icon: Calculator },
  { href: '/app/bids', labelKey: 'navProposalDraftReview', icon: FileText },
  { href: '/app/sales/cadence', labelKey: 'navFollowUp', icon: Repeat },
  { href: '/app/sales', labelKey: 'navPipelineManagement', icon: TrendingUp },
];
const operationsItemKeys: { href: string; labelKey: AppTranslationKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/app/locations', labelKey: 'navSiteHandover', icon: KeyRound },
  { href: '/app/crews', labelKey: 'navCrewManagement', icon: Users },
  { href: '/app/templates', labelKey: 'navBrandStandards', icon: Award },
  { href: '/app/schedules', labelKey: 'navSchedules', icon: Calendar },
  { href: '/app/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
  { href: '/app/issues', labelKey: 'navIssues', icon: AlertCircle },
  { href: '/app/tasks', labelKey: 'navMyTasks', icon: ClipboardCheck },
  { href: '/app/supplies', labelKey: 'navSupplies', icon: Package },
  { href: '/app/contracts', labelKey: 'navContracts', icon: FileUp },
  { href: '/app/helphub', labelKey: 'navHelpHubQR', icon: Ticket },
  { href: '/app/messages', labelKey: 'navMessages', icon: MessageCircle },
  { href: '/app/qc-assign', labelKey: 'navQcTaskAssign', icon: ListChecks },
  { href: '/app/admin', labelKey: 'navAdmin', icon: Settings },
];

export function MobileSidebar({ logoUrl }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <>
      {/* Mobile Header - black so white/yellow logo blends */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-black border-b border-white/10 h-20 flex items-center justify-between px-4 text-white">
        <div className="flex items-center gap-3 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-12 w-12 text-white hover:bg-white/10 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </Button>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Company Logo"
              width={160}
              height={60}
              className="h-14 w-auto object-contain bg-transparent"
              priority
              unoptimized
            />
          ) : (
            <Image
              src="/transparent.png"
              alt="JANIBEAR Logo"
              width={200}
              height={72}
              className="h-14 w-auto object-contain bg-transparent [&>img]:bg-transparent"
              priority
              unoptimized
            />
          )}
        </div>
        <div className="flex items-center gap-2 text-white [&_button]:text-white [&_button]:hover:bg-white/10 [&_button]:hover:text-white [&_.rounded-lg]:border-white/20">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-80 bg-white dark:bg-gray-900 shadow-xl lg:hidden transform transition-transform duration-300">
            <div className="flex h-full flex-col">
              <div className="flex h-20 items-center justify-between border-b dark:border-gray-800 px-4">
                <Link href="/app/dashboard" className="flex items-center gap-3 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      width={200}
                      height={70}
                      className="h-16 w-auto object-contain bg-transparent"
                      priority
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/transparent.png"
                      alt="JANIBEAR Logo"
                      width={220}
                      height={80}
                      className="h-16 w-auto object-contain bg-transparent [&>img]:bg-transparent"
                      priority
                      unoptimized
                    />
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-12 w-12"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="p-4 border-b dark:border-gray-800 space-y-3">
                <GlobalSearch />
              </div>

              <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
                <Link
                  href="/app/dashboard"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                    pathname === '/app/dashboard'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0" />
                  {t('navDashboard')}
                </Link>
                <Link
                  href="/app/university"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                    pathname.startsWith('/app/university')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <GraduationCap className="h-5 w-5 shrink-0" />
                  {t('navUniversity')}
                </Link>

                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('navSales')}
                  </p>
                  {salesItemKeys.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={`${item.href}-${item.labelKey}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('navOperations')}
                  </p>
                  {operationsItemKeys.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={`${item.href}-${item.labelKey}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-2 border-t dark:border-gray-800">
                  <Link
                    href="/app/settings"
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                      pathname.startsWith('/app/settings')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    {t('navSettings')}
                  </Link>
                </div>
              </nav>

              <div className="border-t dark:border-gray-800 p-4">
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  className="w-full h-12 text-base"
                >
                  {t('signOut')}
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
