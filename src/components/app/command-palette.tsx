'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  MapPin,
  ClipboardCheck,
  AlertCircle,
  Users,
  FileText,
  Building2,
  Contact,
  FileSearch,
  Calculator,
  Plus,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'New Walkthrough', href: '/app/walkthroughs/new', icon: FileSearch },
  { label: 'New Proposal', href: '/app/proposals/build', icon: Calculator },
  { label: 'New Site', href: '/app/sites/new', icon: MapPin },
  { label: 'Start Inspection', href: '/app/inspections/start', icon: ClipboardCheck },
  { label: 'New Account', href: '/app/accounts/new', icon: Building2 },
  { label: 'New Lead', href: '/app/sales/leads/new', icon: Users },
];

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const search = async () => {
      setIsSearching(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSearching(false);
        return;
      }
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();
      if (!membership) {
        setIsSearching(false);
        return;
      }
      const searchResults: SearchResult[] = [];
      const [clients, locations, issues, crews] = await Promise.all([
        supabase.from('clients').select('id, name').eq('org_id', membership.org_id).ilike('name', `%${query}%`).limit(5),
        supabase.from('locations').select('id, name').eq('org_id', membership.org_id).ilike('name', `%${query}%`).limit(5),
        supabase.from('issues').select('id, title, status').eq('org_id', membership.org_id).ilike('title', `%${query}%`).limit(5),
        supabase.from('crews').select('id, name').eq('org_id', membership.org_id).ilike('name', `%${query}%`).limit(5),
      ]);
      (clients.data ?? []).forEach((c: { id: string; name: string }) => searchResults.push({ id: c.id, type: 'Account', title: c.name, href: `/app/crm/clients/${c.id}` }));
      (locations.data ?? []).forEach((l: { id: string; name: string }) => searchResults.push({ id: l.id, type: 'Site', title: l.name, href: `/app/sites/${l.id}` }));
      (issues.data ?? []).forEach((i: { id: string; title: string }) => searchResults.push({ id: i.id, type: 'Issue', title: i.title, href: `/app/issues/${i.id}` }));
      (crews.data ?? []).forEach((c: { id: string; name: string }) => searchResults.push({ id: c.id, type: 'Crew', title: c.name, href: `/app/crews/${c.id}` }));
      setResults(searchResults);
      setIsSearching(false);
    };
    const t = setTimeout(search, 200);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelect = (href: string) => {
    close();
    router.push(href);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50" onClick={close} aria-hidden />
      <div className="fixed left-1/2 top-[20%] z-[201] w-full max-w-xl -translate-x-1/2 px-4" role="dialog" aria-modal aria-label="Command palette">
        <Card className="shadow-2xl border-2 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search sites, leads, crews, accounts…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-12 text-base"
                autoFocus
              />
              <kbd className="hidden sm:inline text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {query.length < 2 ? (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick actions</div>
              ) : (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isSearching ? 'Searching…' : 'Results'}
                </div>
              )}
              {query.length < 2 ? (
                <div className="pb-2">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        onClick={(e) => { e.preventDefault(); handleSelect(action.href); }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted rounded-none"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{action.label}</span>
                        <Plus className="h-4 w-4 ml-auto text-muted-foreground shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="pb-2">
                  {results.length === 0 && !isSearching && <div className="px-3 py-4 text-sm text-muted-foreground">No results for &quot;{query}&quot;</div>}
                  {results.map((r) => (
                    <button
                      key={`${r.type}-${r.id}`}
                      type="button"
                      onClick={() => handleSelect(r.href)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-muted text-left rounded-none"
                    >
                      {r.type === 'Account' && <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {r.type === 'Site' && <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {r.type === 'Issue' && <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {r.type === 'Crew' && <Users className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="truncate flex-1">{r.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
