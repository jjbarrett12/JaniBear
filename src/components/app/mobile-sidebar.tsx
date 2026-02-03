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
  Package
} from 'lucide-react';
import { GlobalSearch } from '@/components/search/global-search';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';

interface MobileSidebarProps {
  logoUrl?: string | null;
}

export function MobileSidebar({ logoUrl }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/sales', label: 'Sales', icon: TrendingUp },
    { href: '/app/supplies', label: 'Supplies', icon: Package },
    { href: '/app/locations', label: 'Locations', icon: MapPin },
    { href: '/app/crews', label: 'Crews', icon: Users },
    { href: '/app/templates', label: 'Templates', icon: FileText },
    { href: '/app/schedules', label: 'Schedules', icon: Calendar },
    { href: '/app/inspections', label: 'Inspections', icon: ClipboardCheck },
    { href: '/app/tasks', label: 'My Tasks', icon: ClipboardCheck },
    { href: '/app/issues', label: 'Issues', icon: AlertCircle },
    { href: '/app/bids', label: 'Bids & Estimates', icon: Calculator },
    { href: '/app/contracts', label: 'Contracts', icon: FileUp },
    { href: '/app/qc-assign', label: 'QC Task Assign', icon: ListChecks },
    { href: '/app/admin', label: 'Admin', icon: Settings },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b dark:border-gray-800 h-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-3 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-12 w-12"
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
              src="/janibear-logo.png"
              alt="JANIBEAR Logo"
              width={200}
              height={72}
              className="h-14 w-auto object-contain bg-transparent"
              priority
              unoptimized
            />
          )}
        </div>
        <DarkModeToggle />
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
                      src="/janibear-logo.png"
                      alt="JANIBEAR Logo"
                      width={220}
                      height={80}
                      className="h-16 w-auto object-contain bg-transparent"
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

              <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[52px] ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t dark:border-gray-800 p-4">
                <Button 
                  onClick={handleSignOut}
                  variant="outline" 
                  className="w-full h-12 text-base"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
