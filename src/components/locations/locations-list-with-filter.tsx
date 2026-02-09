'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin } from 'lucide-react';

type Location = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  square_footage?: number | null;
  status?: string | null;
};

export function LocationsListWithFilter({
  locations,
  hasNewButton = true,
}: {
  locations: Location[];
  hasNewButton?: boolean;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered =
    filter === 'all'
      ? locations
      : locations.filter((loc) => (loc.status ?? 'active') === filter);

  const activeCount = locations.filter((l) => (l.status ?? 'active') === 'active').length;
  const inactiveCount = locations.filter((l) => (l.status ?? 'active') === 'inactive').length;

  return (
    <div className="space-y-4">
      {locations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Account status:</span>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All ({locations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('inactive')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((location) => {
            const status = location.status ?? 'active';
            return (
              <Link key={location.id} href={`/app/locations/${location.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-5 w-5 text-primary shrink-0" />
                        <CardTitle className="text-base truncate">{location.name}</CardTitle>
                      </div>
                      <Badge
                        variant={status === 'active' ? 'default' : 'secondary'}
                        className={
                          status === 'active'
                            ? 'bg-emerald-600 shrink-0'
                            : 'bg-amber-600/80 text-white shrink-0'
                        }
                      >
                        {status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {location.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {location.address}
                        {location.city && `, ${location.city}`}
                        {location.state && ` ${location.state}`}
                      </p>
                    )}
                    {location.square_footage && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        {location.square_footage.toLocaleString()} sq ft
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : locations.length > 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No {filter === 'active' ? 'active' : 'inactive'} locations.
            </p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => setFilter('all')}
            >
              Show all
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
