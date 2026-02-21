'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  Sparkles,
  ShoppingBag,
  Activity,
  FileText,
  Search,
  Bell,
} from 'lucide-react';
import { ImpersonationBanner } from './impersonation-banner';

const NAV_ITEMS = [
  { href: '/platform/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/platform/orgs', label: 'Orgs', icon: Building2 },
  { href: '/platform/users', label: 'Users', icon: Users },
  { href: '/platform/ai', label: 'AI Control Center', icon: Sparkles },
  { href: '/platform/pro-gear', label: 'Pro Gear Shop', icon: ShoppingBag },
  { href: '/platform/system-health', label: 'System Health', icon: Activity },
  { href: '/platform/audit-log', label: 'Audit Log', icon: FileText },
];

export function PlatformShell({
  children,
  impersonatingOrgName,
}: {
  children: React.ReactNode;
  impersonatingOrgName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left nav — 56px icons + padding, enterprise spacing */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/platform/overview" className="flex items-center gap-2">
            <span className="font-semibold text-foreground tracking-tight">Platform</span>
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/platform/overview' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 shrink-0 border-b border-border bg-card flex items-center gap-4 px-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search org or user…"
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <Link
              href="/app/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              App
            </Link>
          </div>
        </header>

        {impersonatingOrgName ? (
          <ImpersonationBanner orgName={impersonatingOrgName} />
        ) : null}

        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
