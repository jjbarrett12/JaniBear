'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Contact, Activity, Inbox } from 'lucide-react';

const ITEMS = [
  { href: '/app/crm', label: 'Accounts', icon: Users },
  { href: '/app/crm/contacts', label: 'Contacts', icon: Contact },
  { href: '/app/crm/activities', label: 'Activities', icon: Activity },
  { href: '/app/crm/follow-ups', label: 'Follow-ups', icon: Inbox },
];

export function CrmSubNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-border">
      {ITEMS.map((item) => {
        const isActive = item.href === '/app/crm'
          ? (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/contacts') && !pathname.startsWith('/app/crm/activities') && !pathname.startsWith('/app/crm/follow-ups')))
          : pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${isActive ? 'bg-muted text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
