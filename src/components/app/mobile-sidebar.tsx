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
  Menu
} from 'lucide-react';
import { GlobalSearch } from '@/components/search/global-search';

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
    { href: '/app/locations', label: 'Locations', icon: MapPin },
    { href: '/app/crews', label: 'Crews', icon: Users },
    { href: '/app/templates', label: 'Templates', icon: FileText },
    { href: '/app/schedules', label: 'Schedules', icon: Calendar },
    { href: '/app/inspections', label: 'Inspections', icon: ClipboardCheck },
    { href: '/app/tasks', label: 'My Tasks', icon: ClipboardCheck },
    { href: '/app/issues', label: 'Issues', icon: AlertCircle },
    { href: '/app/bids', label: 'Bids & Estimates', icon: Calculator },
    { href: '/app/contracts', label: 'Contracts', icon: FileUp },
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b h-16 flex items-center justify-between px-4">
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
              width={100}
              height={30}
              className="h-8 w-auto object-contain bg-transparent"
              priority
            />
          ) : (
            <Image
              src="/janibear-logo.png"
              alt="Janibear Logo"
              width={220}
              height={72}
              className="h-12 w-auto object-contain bg-transparent"
              priority
              unoptimized
            />
          )}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-xl lg:hidden transform transition-transform duration-300">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-between border-b px-6">
                <Link href="/app/dashboard" className="flex items-center gap-3 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      width={180}
                      height={60}
                      className="h-12 w-auto object-contain bg-transparent"
                      priority
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/janibear-logo.png"
                      alt="Janibear Logo"
                      width={220}
                      height={72}
                      className="h-12 w-auto object-contain bg-transparent"
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

              <div className="p-4 border-b space-y-3">
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
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t p-4">
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
