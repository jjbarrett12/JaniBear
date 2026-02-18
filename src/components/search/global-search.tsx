'use client';

import { useState, useEffect, useRef } from 'react';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'location' | 'inspection' | 'issue' | 'crew' | 'template';
  title: string;
  subtitle?: string;
  href: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      setIsOpen(true);
      const supabase = createClient();

      try {
        // Get user's org
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!membership) return;

        const searchResults: SearchResult[] = [];

        // Search locations
        const { data: locations } = await supabase
          .from('facilities')
          .select('id, name, address_line1, city, account_id')
          .eq('org_id', membership.org_id)
          .ilike('name', `%${query}%`)
          .limit(5);

        if (locations) {
          locations.forEach((loc: { id: string; name: string; address_line1?: string; city?: string; account_id?: string }) => {
            searchResults.push({
              id: loc.id,
              type: 'location',
              title: loc.name,
              subtitle: loc.address_line1 || loc.city || undefined,
              href: loc.account_id ? `/app/accounts/${loc.account_id}/facilities/${loc.id}` : '/app/accounts',
            });
          });
        }

        // Search inspections
        const { data: inspections } = await supabase
          .from('inspections')
          .select('id, facility_id, completed_at, total_score')
          .eq('org_id', membership.org_id)
          .order('completed_at', { ascending: false })
          .limit(5);

        if (inspections) {
          const facilityIds = inspections.map((i) => i.facility_id).filter(Boolean);
          const { data: locs } = await supabase
            .from('facilities')
            .select('id, name')
            .in('id', facilityIds);

          const locationMap = new Map(locs?.map((l) => [l.id, l.name]) || []);

          inspections.forEach((insp) => {
            const facilityName = locationMap.get(insp.facility_id || '') || 'Unknown Facility';
            searchResults.push({
              id: insp.id,
              type: 'inspection',
              title: `Inspection - ${facilityName}`,
              subtitle: insp.completed_at ? formatDate(insp.completed_at) : 'In Progress',
              href: `/app/inspections/${insp.id}`,
            });
          });
        }

        // Search issues
        const { data: issues } = await supabase
          .from('issues')
          .select('id, title, status')
          .eq('org_id', membership.org_id)
          .ilike('title', `%${query}%`)
          .limit(5);

        if (issues) {
          issues.forEach((issue) => {
            searchResults.push({
              id: issue.id,
              type: 'issue',
              title: issue.title,
              subtitle: issue.status,
              href: `/app/issues/${issue.id}`,
            });
          });
        }

        // Search crews
        const { data: crews } = await supabase
          .from('crews')
          .select('id, name')
          .eq('org_id', membership.org_id)
          .ilike('name', `%${query}%`)
          .limit(5);

        if (crews) {
          crews.forEach((crew) => {
            searchResults.push({
              id: crew.id,
              type: 'crew',
              title: crew.name,
              href: `/app/crews/${crew.id}`,
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleResultClick = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  const iconMap = {
    location: MapPin,
    inspection: ClipboardCheck,
    issue: AlertCircle,
    crew: Users,
    template: FileText,
  };

  return (
    <div ref={searchRef} className="relative w-full min-w-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search locations, inspections, issues..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 h-12 text-base"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-xl border-2">
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {results.map((result) => {
                const Icon = iconMap[result.type] || Search;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result.href)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">
                      {result.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && query.length >= 2 && !isSearching && results.length === 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-xl border-2">
          <CardContent className="p-4 text-center text-sm text-gray-500">
            No results found for &quot;{query}&quot;
          </CardContent>
        </Card>
      )}
    </div>
  );
}
