'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Tab = 'required' | 'expiring' | 'available';

interface RequiredItem {
  id: string;
  courseId: string;
  title: string;
  status: string;
  estimatedMinutes: number;
}

interface ExpiringItem {
  id: string;
  courseId: string;
  title: string;
  expiresAt: string;
}

interface AvailableCourse {
  id: string;
  title: string;
  estimatedMinutes: number;
  level: string;
}

export function UniversityMyTrainingClient({
  requiredItems,
  expiringItems,
  availableCourses,
}: {
  requiredItems: RequiredItem[];
  expiringItems: ExpiringItem[];
  availableCourses: AvailableCourse[];
}) {
  const [tab, setTab] = useState<Tab>('required');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={tab === 'required' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTab('required')}
        >
          Required ({requiredItems.length})
        </Button>
        <Button
          variant={tab === 'expiring' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTab('expiring')}
        >
          Expiring soon ({expiringItems.length})
        </Button>
        <Button
          variant={tab === 'available' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTab('available')}
        >
          Available ({availableCourses.length})
        </Button>
      </div>

      {tab === 'required' && (
        <Card>
          <CardContent className="pt-4">
            {requiredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No required courses for your role right now.</p>
            ) : (
              <ul className="space-y-2">
                {requiredItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/app/university/course/${item.courseId}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="font-medium">{item.title}</span>
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status === 'completed' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'Not started'}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'expiring' && (
        <Card>
          <CardContent className="pt-4">
            {expiringItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No certifications expiring in the next 30 days.</p>
            ) : (
              <ul className="space-y-2">
                {expiringItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/app/university/course/${item.courseId}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="font-medium">{item.title}</span>
                      <span className="text-sm text-muted-foreground">
                        Expires {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'available' && (
        <Card>
          <CardContent className="pt-4">
            {availableCourses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No additional courses available. You’re all set.</p>
            ) : (
              <ul className="space-y-2">
                {availableCourses.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/app/university/course/${c.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    >
                      <span className="font-medium">{c.title}</span>
                      <span className="text-sm text-muted-foreground">{c.estimatedMinutes} min · {c.level}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
